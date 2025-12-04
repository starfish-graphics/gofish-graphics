import { GoFishNode } from "../_node";
import { FancyDims } from "../dims";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { coord } from "../coordinateTransforms/coord";
import { layer } from "./layer";
import { withGoFish } from "../withGoFish";
import { GoFishAST } from "../_ast";

/* layer context */
type LayerContext = {
  [name: string]: {
    data: any[];
    nodes: GoFishNode[];
  };
};

let layerContext: LayerContext | null = null;

export const getLayerContext = (): LayerContext => {
  if (!layerContext) {
    layerContext = {};
  }
  return layerContext;
};

export const initLayerContext = (): void => {
  layerContext = {};
};

export const resetLayerContext = (): void => {
  layerContext = null;
};
export const frame = withGoFish(
  (
    options: {
      key?: string;
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
          key: options.key,
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
