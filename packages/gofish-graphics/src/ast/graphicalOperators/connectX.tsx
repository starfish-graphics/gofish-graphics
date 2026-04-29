import { GoFishAST } from "../_ast";
import { connect } from "./connect";
import { MaybeValue } from "../data";
export const connectX = (
  {
    fill,
    interpolation = "bezier",
    stroke,
    strokeWidth,
    opacity,
    mode = "edge",
    mixBlendMode,
  }: {
    fill?: MaybeValue<string>;
    interpolation?: "linear" | "bezier";
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    mode?: "edge" | "center";
    mixBlendMode?: "multiply" | "normal";
  },
  children: GoFishAST[]
) => {
  return connect(
    {
      direction: "x",
      fill,
      interpolation,
      stroke,
      strokeWidth,
      opacity,
      mode,
      mixBlendMode,
    },
    children
  );
};
