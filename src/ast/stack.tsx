import { For } from "solid-js";
import { GoFishNode } from "./_node";
import { Value } from "./data";
import { elaborateDims, elaborateDirection, FancyDims, FancyDirection } from "./dims";

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
      layout: (children) => {
        const childDims = children.map((child) => child.layout());
        /* TODO */
        return {
          intrinsicDims: [
            {
              min: 0,
              size: 0,
              center: 0,
              max: 0,
            },
            {
              min: 0,
              size: 0,
              center: 0,
              max: 0,
            },
          ],
          transform: {
            translate: [0, 0],
          },
        };
      },
      render: ({ intrinsicDims, transform }, children) => {
        return <g>{children}</g>;
      },
    },
    children
  );
};
