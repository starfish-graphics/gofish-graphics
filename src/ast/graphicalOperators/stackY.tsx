import { stack } from "./stack";
import { GoFishAST } from "../_ast";
import { FancyDims } from "../dims";
import { Collection } from "lodash";
import { withGoFish } from "../withGoFish";

export const stackY = withGoFish(
  (
    {
      name,
      key,
      spacing,
      alignment = "middle",
      sharedScale = false,
      mode = "edge-to-edge",
      reverse = false,
      dir = "btt",
      ...fancyDims
    }: {
      name?: string;
      key?: string;
      spacing?: number;
      alignment?: "start" | "middle" | "end";
      sharedScale?: boolean;
      mode?: "edge-to-edge" | "center-to-center";
      reverse?: boolean;
      dir?: "ttb" | "btt";
    } & FancyDims,
    children: GoFishAST[] | Collection<GoFishAST>
  ) => {
    return stack(
      {
        name,
        direction: "y",
        key,
        spacing,
        alignment,
        sharedScale,
        mode,
        reverse: dir === "ttb" ? true : dir === "btt" ? false : reverse,
        ...fancyDims,
      },
      children
    );
  }
);
