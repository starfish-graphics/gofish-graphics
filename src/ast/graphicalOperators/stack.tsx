import { For } from "solid-js";
import { GoFishNode } from "../_node";
import { getMeasure, getValue, isValue, Value } from "../data";
import { Direction, elaborateDims, elaborateDirection, FancyDims, FancyDirection, FancySize, Size } from "../dims";
import _, { size } from "lodash";
import { canUnifyDomains, continuous, ContinuousDomain, Domain, unifyContinuousDomains } from "../domain";
import { findTargetMonotonic } from "../../util";
import { GoFishAST } from "../_ast";

export const stack = (
  {
    name,
    direction,
    spacing = 0,
    alignment = "middle",
    sharedScale = false,
    mode = "edge-to-edge",
    ...fancyDims
  }: {
    name?: string;
    direction: FancyDirection;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
    sharedScale?: boolean;
    mode?: "edge-to-edge" | "center-to-center";
  } & FancyDims,
  children: GoFishAST[]
) => {
  const stackDir = elaborateDirection(direction);
  const alignDir = (1 - stackDir) as Direction;
  const dims = elaborateDims(fancyDims);

  return new GoFishNode(
    {
      type: "stack",
      name,
      shared: [sharedScale, sharedScale],
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        // For the stacking dimension, unify domains like in layer
        const filteredStackDirChildDomains = childPosDomains
          .map((childPosDomain) => childPosDomain[stackDir])
          .filter((d) => d !== undefined);

        return [
          stackDir === 0 && filteredStackDirChildDomains.length > 0 && canUnifyDomains(filteredStackDirChildDomains)
            ? unifyContinuousDomains(filteredStackDirChildDomains)
            : isValue(dims[0].min)
            ? continuous({
                value: [getValue(dims[0].min)!, getValue(dims[0].min)!],
                measure: getMeasure(dims[0].min),
              })
            : undefined,
          stackDir === 1 && filteredStackDirChildDomains.length > 0 && canUnifyDomains(filteredStackDirChildDomains)
            ? unifyContinuousDomains(filteredStackDirChildDomains)
            : isValue(dims[1].min)
            ? continuous({
                value: [getValue(dims[1].min)!, getValue(dims[1].min)!],
                measure: getMeasure(dims[1].min),
              })
            : undefined,
        ];
      },
      /* TODO: I need to write to the children!!!!!!!!!! */
      // inferDomains: (childDomains: Size<Domain>[]) => {
      //   return {
      //     [stackDir]: canUnifyDomains(childDomains.map((childDomain) => childDomain[stackDir]))
      //       ? unifyContinuousDomains(childDomains.map((childDomain) => childDomain[stackDir]) as ContinuousDomain[])
      //       : undefined,
      //     [alignDir]: canUnifyDomains(childDomains.map((childDomain) => childDomain[alignDir]))
      //       ? unifyContinuousDomains(childDomains.map((childDomain) => childDomain[alignDir]) as ContinuousDomain[])
      //       : undefined,
      //   };
      // },
      /* TODO: I need to search for the right scale factor in a way that accounts for all layout
modes!!!

      Nodes are either:
      - fixed size
      - scaled (b/c data-driven) (eg bar chart bar heights). equal scale? shared scale?
      - (uniform) flexed? or maybe grow to whatever size the parent gives them? (eg bar chart
        bar widths) equal size? shared size?

      child.size[0].mode = "fixed" | "scaled" | "grow"
*/
      inferSizeDomains: (shared, size, children) => {
        // if (shared[stackDir]) {
        //   /* TODO: this is not a very good upper bound guess! */
        //   const stackScaleFactor = findTargetMonotonic(size[stackDir], stackSize, { upperBoundGuess: size[stackDir] });
        // }

        size = {
          [stackDir]: dims[stackDir].size ?? size[stackDir],
          [alignDir]: dims[alignDir].size ?? size[alignDir],
        };

        return (scaleFactors: Size): FancySize => {
          const stackSize =
            mode === "edge-to-edge"
              ? _.sum(children.map((child) => child.inferSizeDomains(size)(scaleFactors)[stackDir])) +
                spacing * (children.length - 1)
              : children[0].inferSizeDomains(size)(scaleFactors)[stackDir] / 2 +
                spacing * (children.length - 1) +
                children[children.length - 1].inferSizeDomains(size)(scaleFactors)[stackDir] / 2;
          const alignSize = Math.max(...children.map((child) => child.inferSizeDomains(size)(scaleFactors)[alignDir]));
          return {
            [stackDir]: stackSize,
            [alignDir]: alignSize,
          };
        };
      },
      layout: (shared, size, scaleFactors, children, measurement, posScales) => {
        const stackPos = isValue(dims[stackDir].min)
          ? posScales[stackDir]!(getValue(dims[stackDir].min)!)
          : dims[stackDir].min ?? undefined;
        const alignPos = isValue(dims[alignDir].min)
          ? posScales[alignDir]!(getValue(dims[alignDir].min)!)
          : dims[alignDir].min ?? undefined;

        size = {
          [stackDir]: dims[stackDir].size ?? size[stackDir],
          [alignDir]: dims[alignDir].size ?? size[alignDir],
        };

        if (shared[stackDir]) {
          const stackScaleFactor = findTargetMonotonic(
            size[stackDir],
            (stackScaleFactor) =>
              measurement({
                [stackDir]: stackScaleFactor,
                [alignDir]: 1,
              })[stackDir],
            {
              upperBoundGuess: size[stackDir],
            }
          );
          scaleFactors[stackDir] = stackScaleFactor;
        }

        if (shared[alignDir]) {
          const alignScaleFactor = findTargetMonotonic(
            size[alignDir],
            (alignScaleFactor) => measurement({ [stackDir]: 1, [alignDir]: alignScaleFactor })[alignDir],
            { upperBoundGuess: size[alignDir] }
          );
          scaleFactors[alignDir] = alignScaleFactor;
        }

        const childPlaceables = children.map((child) => child.layout(size, scaleFactors, posScales));

        /* align */
        if (alignment === "start") {
          for (const child of childPlaceables) {
            child.place({ [alignDir]: 0 });
          }
        } else if (alignment === "middle") {
          for (const child of childPlaceables) {
            child.place({ [alignDir]: -child.dims[alignDir].size! / 2 });
          }
        } else if (alignment === "end") {
          for (const child of childPlaceables) {
            child.place({ [alignDir]: -child.dims[alignDir].size! });
          }
        }

        let alignMin: number;
        if (alignment === "start") {
          alignMin = 0;
        } else if (alignment === "middle") {
          alignMin = Math.min(...childPlaceables.map((child) => -child.dims[alignDir].size! / 2));
        } /* if (alignment === "end") */ else {
          alignMin = Math.min(...childPlaceables.map((child) => -child.dims[alignDir].size!));
        }

        /* distribute */
        let pos = 0;
        if (mode === "edge-to-edge") {
          for (const child of childPlaceables) {
            child.place({ [stackDir]: pos });
            pos += child.dims[stackDir].size! + spacing;
          }
        } else if (mode === "center-to-center") {
          for (const child of childPlaceables) {
            child.place({ [stackDir]: pos - child.dims[stackDir].size! / 2 });
            pos += spacing;
          }
        }

        return {
          intrinsicDims: {
            [alignDir]: {
              min: alignMin,
              size: Math.max(...childPlaceables.map((child) => child.dims[alignDir].size!)),
            },
            [stackDir]: {
              min: 0,
              size: pos,
              center: pos / 2,
              max: pos,
            },
          },
          transform: {
            translate: {
              [alignDir]: alignPos !== undefined ? alignPos - alignMin : undefined,
              [stackDir]: stackPos !== undefined ? stackPos : undefined,
            },
          },
        };
      },
      render: ({ intrinsicDims, transform }, children) => {
        return (
          <g transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}>
            {children}
          </g>
        );
      },
    },
    children
  );
};
