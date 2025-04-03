import { GoFishAST } from "../_ast";
import { connect } from "./connect";
export const connectX = (
  {
    fill,
    interpolation = "bezier",
    stroke,
    strokeWidth,
    opacity,
    mode = "edge-to-edge",
    mixBlendMode,
  }: {
    fill: string;
    interpolation?: "linear" | "bezier";
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    mode?: "edge-to-edge" | "center-to-center";
    mixBlendMode?: "multiply" | "normal";
  },
  children: GoFishAST[]
) => {
  return connect({ direction: "x", fill, interpolation, stroke, strokeWidth, opacity, mode, mixBlendMode }, children);
};
