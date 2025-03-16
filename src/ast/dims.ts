export type Interval<T = number> = {
  min?: T;
  center?: T;
  max?: T;
  size?: T;
};

export type Dimensions<T = number> = Interval<T>[];

export type FancyDims<T = number> =
  | {
      x?: T;
      y?: T;
      cx?: T;
      cy?: T;
      x2?: T;
      y2?: T;
      w?: T;
      h?: T;
    }
  | { dims: Dimensions<T> };

export const elaborateDims = <T>(dims: FancyDims<T>): Dimensions<T> => {
  if ("dims" in dims) {
    return dims.dims;
  }
  return [
    { min: dims.x, center: dims.cx, max: dims.x2, size: dims.w },
    { min: dims.y, center: dims.cy, max: dims.y2, size: dims.h },
  ];
};

export type Direction = 0 | 1;
export type FancyDirection = "x" | "y" | Direction;

export const elaborateDirection = (direction: FancyDirection): Direction => {
  switch (direction) {
    case "x":
      return 0;
    case "y":
      return 1;
    default:
      return direction;
  }
};

export type Position = [number | undefined, number | undefined];

export type FancyPosition = { x?: number; y?: number } | Position;

export const elaboratePosition = (position: FancyPosition): Position => {
  if (Array.isArray(position)) {
    return position;
  }
  return [position.x, position.y];
};
