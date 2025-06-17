import { stack } from "./stack";
import { GoFishAST } from "../_ast";
import { FancyDims } from "../dims";
import { Collection } from "lodash";
import { withGoFish } from "../withGoFish";

export const stackY = withGoFish(
  (
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
    children: GoFishAST[] | Collection<GoFishAST>
  ) => {
    return stack({ direction: "y", spacing, alignment, sharedScale, mode, reverse, ...fancyDims }, children);
  }
);
