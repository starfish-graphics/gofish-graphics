export type Interval<T = number> = {
  min?: T;
  center?: T;
  max?: T;
  size?: T;
  embedded?: boolean;
};

export type Dimensions<T = number> = Interval<T>[];

export type FancyDims<T = number> =
  | {
      x?: T;
      cx?: T;
      x2?: T;
      w?: T;
      emX?: boolean;
      y?: T;
      cy?: T;
      y2?: T;
      h?: T;
      emY?: boolean;
    }
  | {
      0?: Interval<T>;
      1?: Interval<T>;
    }
  | { dims: Dimensions<T> };

export const elaborateDims = <T>(dims: FancyDims<T>): Dimensions<T> => {
  if ("dims" in dims) {
    return dims.dims;
  }
  if ("0" in dims || "1" in dims) {
    return [
      {
        min: dims[0]?.min,
        center: dims[0]?.center,
        max: dims[0]?.max,
        size: dims[0]?.size,
        embedded: dims[0]?.embedded,
      },
      {
        min: dims[1]?.min,
        center: dims[1]?.center,
        max: dims[1]?.max,
        size: dims[1]?.size,
        embedded: dims[1]?.embedded,
      },
    ];
  }

  if (!("x" in dims)) dims.x = dims.cx !== undefined && dims.w !== undefined ? dims.cx - dims.w / 2 : undefined;
  if (!("y" in dims)) dims.y = dims.cy !== undefined && dims.h !== undefined ? dims.cy - dims.h / 2 : undefined;

  return [
    { min: dims.x, center: dims.cx, max: dims.x2, size: dims.w, embedded: dims.emX },
    { min: dims.y, center: dims.cy, max: dims.y2, size: dims.h, embedded: dims.emY },
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

export type FancyPosition = { x?: number; y?: number } | { 0?: number; 1?: number } | Position;

export const elaboratePosition = (position: FancyPosition): Position => {
  if (Array.isArray(position)) {
    return position;
  }
  if ("x" in position || "y" in position) {
    return [position.x, position.y];
  }
  if ("0" in position || "1" in position) {
    return [position[0], position[1]];
  }
};

export type Size<T = number> = [T, T];

export type FancySize<T = number> = { w: T; h: T } | { [K in Direction]: T } | Size<T>;

export const elaborateSize = <T>(size: FancySize<T>): Size<T> => {
  if (Array.isArray(size)) {
    return size;
  }
  if ("0" in size || "1" in size) {
    return [size[0], size[1]];
  }
  return [size.w, size.h];
};

export type Transform = { translate: Position; scale?: Size };
export type FancyTransform = { translate?: FancyPosition; scale?: FancySize };

export const elaborateTransform = (transform: FancyTransform): Transform => {
  return {
    translate: elaboratePosition(transform?.translate ?? {}),
    scale: elaborateSize(transform?.scale ?? {}),
  };
};
