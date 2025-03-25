import { GoFishNode } from "../_node";

/* This packages/seals up something as an opaque "box" so it's not transformed.

This is used for eg scatter pie. TODO: maybe it's enough to just have coord do this? Maybe coord is
a plot? Maybe this is plot? But then what about radar??
Also if a plot is basically a "mark"... then what?
*/
export const box = (children: GoFishNode[]) => {
  return new GoFishNode({
    type: "box",
    children,
  });
};
