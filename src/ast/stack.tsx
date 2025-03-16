import { For } from "solid-js";
import { GoFishNode } from "./_node";
import { Value } from "./data";
import { elaborateDims, elaborateDirection, FancyDims, FancyDirection } from "./dims";

export const stack = (
  {
    direction,
    spacing = 0,
    alignment = "middle",
    w,
    h,
  }: {
    direction: FancyDirection;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
    w?: number;
    h?: number;
  },
  children: GoFishNode[]
) => {
  const dir = elaborateDirection(direction);
  return new GoFishNode(
    {
      inferDomain: () => {},
      sizeThatFits: () => {},
      layout: () => {},
      render: () => {
        return (
          <g>
            <For each={children}>{(child) => child.render()}</For>
          </g>
        );
      },
    },
    []
  );
};
