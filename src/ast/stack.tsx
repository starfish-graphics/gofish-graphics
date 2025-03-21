import { For } from "solid-js";
import { GoFishNode } from "./_node";
import { Value } from "./data";
import { Direction, elaborateDims, elaborateDirection, FancyDims, FancyDirection, FancySize, Size } from "./dims";
import _, { size } from "lodash";
import { canUnifyDomains, ContinuousDomain, Domain, unifyContinuousDomains } from "./domain";
import { findTargetMonotonic } from "../util";

export const stack = (
  {
    direction,
    spacing = 0,
    alignment = "middle",
    sharedScale = false,
  }: {
    direction: FancyDirection;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
    sharedScale?: boolean;
  },
  children: GoFishNode[]
) => {
  const stackDir = elaborateDirection(direction);
  const alignDir = (1 - stackDir) as Direction;

  return new GoFishNode(
    {
      type: "stack",
      shared: [false, sharedScale],
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
      measure: (shared, size, children) => {
        // if (shared[stackDir]) {
        //   /* TODO: this is not a very good upper bound guess! */
        //   const stackScaleFactor = findTargetMonotonic(size[stackDir], stackSize, { upperBoundGuess: size[stackDir] });
        // }

        return (scaleFactors: Size): FancySize => {
          const stackSize =
            _.sum(children.map((child) => child.measure(size)(scaleFactors)[stackDir])) +
            spacing * (children.length - 1);
          const alignSize = Math.max(...children.map((child) => child.measure(size)(scaleFactors)[alignDir]));
          return {
            [stackDir]: stackSize,
            [alignDir]: alignSize,
          };
        };
      },
      layout: (shared, size, scaleFactors, children, measurement) => {
        // TODO: alignDir...
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

        const childPlaceables = children.map((child) => child.layout(size, scaleFactors));

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
        for (const child of childPlaceables) {
          child.place({ [stackDir]: pos });
          pos += child.dims[stackDir].size! + spacing;
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
            translate: [undefined, undefined],
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
