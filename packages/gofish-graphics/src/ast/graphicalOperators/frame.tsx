import { FancyDims } from "../dims";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { coord } from "../coordinateTransforms/coord";
import { layer } from "./layer";
import { createNodeOperator } from "../withGoFish";
import { GoFishAST } from "../_ast";
export const Frame = createNodeOperator(
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

import { createOperator } from "../marks/createOperator";

export type GroupOptions = {
  by?: string;
};

export const group = createOperator<any, GroupOptions>(
  async (_opts, children) =>
    (await Frame({}, children)) as unknown as GoFishAST,
  {
    split: ({ by }, d) => {
      if (!by) throw new Error("group requires opts.by = fieldName");
      return Map.groupBy(d, (r: any) => r[by]);
    },
  }
);
