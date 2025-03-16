import { For } from "solid-js";
import { GoFishNode } from "./_node";
import { Value } from "./data";
import { Direction, elaborateDims, elaborateDirection, FancyDims, FancyDirection } from "./dims";

export const stack = (
  {
    direction,
    spacing = 0,
    alignment = "middle",
  }: {
    direction: FancyDirection;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
  },
  children: GoFishNode[]
) => {
  const dir = elaborateDirection(direction);
  return new GoFishNode(
    {
      name: "stack",
      inferDomain: () => {},
      sizeThatFits: () => {},
      layout: (size, children) => {
        const childPlaceables = children.map((child) => child.layout(size));

        const stackDir = dir;
        const alignDir = (1 - stackDir) as Direction;

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
