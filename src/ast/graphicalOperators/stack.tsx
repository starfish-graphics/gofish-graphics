import { For } from "solid-js";
import { GoFishNode } from "../_node";
import { getMeasure, getValue, isValue, Value } from "../data";
import {
  Direction,
  elaborateDims,
  elaborateDirection,
  FancyDims,
  FancyDirection,
  FancySize,
  Size,
} from "../dims";
import _, { Collection, size } from "lodash";
import {
  canUnifyDomains,
  continuous,
  ContinuousDomain,
  Domain,
  unifyContinuousDomains,
} from "../domain";
import { findTargetMonotonic } from "../../util";
import { GoFishAST } from "../_ast";
import { getScaleContext } from "../gofish";
import { withGoFish } from "../withGoFish";

// Utility function to unwrap lodash wrapped arrays
const unwrapLodashArray = function <T>(value: T[] | Collection<T>): T[] {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as Collection<T>).value() as T[];
  }
  return value as T[];
};

export const stack = withGoFish(
  (
    {
      name,
      key,
      direction,
      spacing = 0,
      alignment = "middle",
      sharedScale = false,
      mode = "edge-to-edge",
      reverse = false,
      ...fancyDims
    }: {
      name?: string;
      key?: string;
      direction: FancyDirection;
      spacing?: number;
      alignment?: "start" | "middle" | "end";
      sharedScale?: boolean;
      mode?: "edge-to-edge" | "center-to-center";
      reverse?: boolean;
    } & FancyDims,
    children: GoFishAST[] | Collection<GoFishAST>
  ) => {
    // Unwrap lodash wrapped children if needed
    children = unwrapLodashArray(children);

    const stackDir = elaborateDirection(direction);
    const alignDir = (1 - stackDir) as Direction;
    const dims = elaborateDims(fancyDims);

    return new GoFishNode(
      {
        type: "stack",
        key,
        name,
        shared: [sharedScale, sharedScale],
        inferPosDomains: (childPosDomains: Size<Domain>[]) => {
          // For the stacking dimension, unify domains like in layer
          const filteredStackDirChildDomains = childPosDomains
            .map((childPosDomain) => childPosDomain[stackDir])
            .filter((d) => d !== undefined);

          return [
            stackDir === 0 &&
            filteredStackDirChildDomains.length > 0 &&
            canUnifyDomains(filteredStackDirChildDomains)
              ? unifyContinuousDomains(filteredStackDirChildDomains)
              : isValue(dims[0].min)
                ? continuous({
                    value: [getValue(dims[0].min)!, getValue(dims[0].min)!],
                    measure: getMeasure(dims[0].min),
                  })
                : undefined,
            stackDir === 1 &&
            filteredStackDirChildDomains.length > 0 &&
            canUnifyDomains(filteredStackDirChildDomains)
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

          return {
            [stackDir]: (scaleFactor: number) =>
              mode === "edge-to-edge"
                ? _.sum(
                    children.map((child) =>
                      child.inferSizeDomains(size)[stackDir](scaleFactor)
                    )
                  ) +
                  spacing * (children.length - 1)
                : children[0].inferSizeDomains(size)[stackDir](scaleFactor) /
                    2 +
                  spacing * (children.length - 1) +
                  children[children.length - 1]
                    .inferSizeDomains(size)
                    [stackDir](scaleFactor) /
                    2,
            [alignDir]: (scaleFactor: number) =>
              Math.max(
                ...children.map((child) =>
                  child.inferSizeDomains(size)[alignDir](scaleFactor)
                )
              ),
          };
        },
        layout: (
          shared,
          size,
          scaleFactors,
          children,
          measurement,
          posScales
        ) => {
          if (reverse) {
            children = children.reverse();
          }
          const stackPos = isValue(dims[stackDir].min)
            ? posScales[stackDir]!(getValue(dims[stackDir].min)!)
            : (dims[stackDir].min ?? undefined);
          const alignPos = isValue(dims[alignDir].min)
            ? posScales[alignDir]!(getValue(dims[alignDir].min)!)
            : (dims[alignDir].min ?? undefined);

          size = {
            [stackDir]: dims[stackDir].size ?? size[stackDir],
            [alignDir]: dims[alignDir].size ?? size[alignDir],
          };

          if (shared[stackDir]) {
            const stackScaleFactor = findTargetMonotonic(
              size[stackDir],
              (stackScaleFactor) => measurement[stackDir](stackScaleFactor),
              {
                upperBoundGuess: size[stackDir],
              }
            );
            scaleFactors[stackDir] = stackScaleFactor;
          }

          if (shared[alignDir]) {
            const alignScaleFactor = findTargetMonotonic(
              size[alignDir],
              (alignScaleFactor) => measurement[alignDir](alignScaleFactor),
              { upperBoundGuess: size[alignDir] }
            );
            scaleFactors[alignDir] = alignScaleFactor;
          }

          // console.log(size, scaleFactors, posScales);
          const scaleContext = getScaleContext();
          scaleContext.y = {
            domain: [0, size[1] / scaleFactors[1]],
            scaleFactor: scaleFactors[1],
          };

          // Calculate available space for children in stacking direction after subtracting spacing
          const totalSpacing = spacing * (children.length - 1);
          const availableStackSpace = size[stackDir] - totalSpacing;
          const childStackSize = availableStackSpace / children.length;

          // Create modified size with equal distribution for stacking direction
          const modifiedSize: Size = [0, 0];
          modifiedSize[stackDir] = childStackSize;
          modifiedSize[alignDir] = size[alignDir];

          const childPlaceables = children.map((child) =>
            child.layout(modifiedSize, scaleFactors, posScales)
          );

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
            alignMin = Math.min(
              ...childPlaceables.map((child) => -child.dims[alignDir].size! / 2)
            );
          } /* if (alignment === "end") */ else {
            alignMin = Math.min(
              ...childPlaceables.map((child) => -child.dims[alignDir].size!)
            );
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
                size: Math.max(
                  ...childPlaceables.map((child) => child.dims[alignDir].size!)
                ),
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
                [alignDir]:
                  alignPos !== undefined ? alignPos - alignMin : undefined,
                [stackDir]: stackPos !== undefined ? stackPos : undefined,
              },
            },
          };
        },
        render: ({ intrinsicDims, transform }, children) => {
          return (
            <g
              transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}
            >
              {children}
            </g>
          );
        },
      },
      children
    );
  }
);
