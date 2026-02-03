import { stack } from "./stack";
import { GoFishAST } from "../_ast";
import { FancyDims } from "../dims";
import { Collection } from "lodash";
import { createOperator } from "../withGoFish";
import { MaybeValue } from "../data";

export const stackX = createOperator(
  (
    {
      name,
      key,
      spacing,
      alignment = "start",
      sharedScale = false,
      mode = "edge-to-edge",
      reverse = false,
      ...fancyDims
    }: {
      name?: string;
      key?: string;
      spacing?: number;
      alignment?: "start" | "middle" | "end";
      sharedScale?: boolean;
      mode?: "edge-to-edge" | "center-to-center";
      reverse?: boolean;
    } & FancyDims<MaybeValue<number>>,
    children: GoFishAST[] | Collection<GoFishAST>
  ) => {
    return stack(
      {
        direction: "x",
        key,
        spacing,
        alignment,
        sharedScale,
        mode,
        reverse,
        ...fancyDims,
      },
      children
    );
  }
);
