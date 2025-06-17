import { stack } from "./stack";
import { GoFishAST } from "../_ast";
import { FancyDims } from "../dims";
import _ from "lodash";

export const stackY = (
  {
    name,
    spacing,
    alignment = "middle",
    sharedScale = false,
    mode = "edge-to-edge",
    reverse = false,
    ...fancyDims
  }: {
    name?: string;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
    sharedScale?: boolean;
    mode?: "edge-to-edge" | "center-to-center";
    reverse?: boolean;
  } & FancyDims,
  children: GoFishAST[] | ReturnType<typeof _>
) => {
  return stack({ direction: "y", spacing, alignment, sharedScale, mode, reverse, ...fancyDims }, children);
};
