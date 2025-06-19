import { GoFishNode } from "../_node";
import { FancyDims } from "../dims";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { coord } from "../coordinateTransforms/coord";
import { layer } from "./layer";
import { withGoFish } from "../withGoFish";
import { GoFishAST } from "../_ast";
export const frame = withGoFish(
  (
    options: {
      coord?: CoordinateTransform;
      x?: number;
      y?: number;
      transform?: { scale?: { x?: number; y?: number } };
      box?: boolean;
    } & FancyDims,
    children: GoFishAST[]
  ) => {
    if (options.coord !== undefined) {
      return coord(
        {
          x: options.x,
          y: options.y,
          transform: options.coord,
        },
        children
      );
    } else {
      return layer(options, children);
    }
  }
);
