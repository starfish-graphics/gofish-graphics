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
