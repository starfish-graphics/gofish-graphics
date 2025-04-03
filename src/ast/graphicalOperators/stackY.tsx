import { stack } from "./stack";
import { GoFishAST } from "../_ast";
import { FancyDims } from "../dims";
export const stackY = (
  {
    name,
    spacing,
    alignment = "middle",
    sharedScale = false,
    mode = "edge-to-edge",
    ...fancyDims
  }: {
    name?: string;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
    sharedScale?: boolean;
    mode?: "edge-to-edge" | "center-to-center";
  } & FancyDims,
  children: GoFishAST[]
) => {
  return stack({ direction: "y", spacing, alignment, sharedScale, mode, ...fancyDims }, children);
};
