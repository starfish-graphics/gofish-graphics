import { Show, type JSX } from "solid-js";
import type { GoFishNode } from "./_node";

/* global pass handler */
export const gofish = (
  { width, height, transform }: { width: number; height: number; transform?: string },
  child: GoFishNode
) => {
  // const domainAST = child.inferDomain();
  // const sizeThatFitsAST = domainAST.sizeThatFits();
  // const layoutAST = sizeThatFitsAST.layout();
  // return render({ width, height, transform }, layoutAST);
  child.layout({ w: width, h: height });
  child.place({ x: 0, y: 0 });
  return render({ width, height, transform }, child);
};

export const render = (
  { width, height, transform }: { width: number; height: number; transform?: string },
  child: GoFishNode
): JSX.Element => (
  <svg width={width} height={height}>
    <Show when={transform} keyed fallback={child.render()}>
      <g transform={transform ?? ""}>{child.render()}</g>
    </Show>
  </svg>
);
