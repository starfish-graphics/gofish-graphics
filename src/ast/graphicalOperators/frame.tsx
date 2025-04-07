import { GoFishNode } from "../_node";
import { FancyDims } from "../dims";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { coord } from "../coordinateTransforms/coord";
import { layer } from "./layer";
export const frame = (
  childrenOrOptions:
    | ({
        coord?: CoordinateTransform;
        x?: number;
        y?: number;
        transform?: { scale?: { x?: number; y?: number } };
        box?: boolean;
      } & FancyDims)
    | GoFishNode[],
  maybeChildren?: GoFishNode[]
) => {
  const options = Array.isArray(childrenOrOptions) ? {} : childrenOrOptions;
  const children = Array.isArray(childrenOrOptions) ? childrenOrOptions : maybeChildren || [];

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
};
