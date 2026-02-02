export type BoundingBox = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

/**
 * Creates a bounding box from min/max values.
 * Ensures minX <= maxX and minY <= maxY.
 */
export function bbox(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): BoundingBox {
  return {
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minY: Math.min(minY, maxY),
    maxY: Math.max(minY, maxY),
  };
}

/**
 * Gets the width of a bounding box
 */
export const width = (bbox: BoundingBox): number => {
  return bbox.maxX - bbox.minX;
};

/**
 * Gets the height of a bounding box
 */
export const height = (bbox: BoundingBox): number => {
  return bbox.maxY - bbox.minY;
};

/**
 * Checks if a bounding box is valid (minX <= maxX and minY <= maxY)
 */
export const isValid = (bbox: BoundingBox): boolean => {
  return bbox.minX <= bbox.maxX && bbox.minY <= bbox.maxY;
};

/**
 * Checks if a bounding box is empty
 */
export const isEmpty = (bbox: BoundingBox): boolean => {
  return bbox.minX > bbox.maxX || bbox.minY > bbox.maxY;
};

/**
 * Checks if a point is contained within a bounding box
 */
export const contains = (bbox: BoundingBox, x: number, y: number): boolean => {
  return x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY;
};

/**
 * Checks if two bounding boxes overlap
 */
export const overlaps = (a: BoundingBox, b: BoundingBox): boolean => {
  return (
    a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY
  );
};

/**
 * Computes the union of two bounding boxes
 */
export const union = (a: BoundingBox, b: BoundingBox): BoundingBox => {
  return bbox(
    Math.min(a.minX, b.minX),
    Math.max(a.maxX, b.maxX),
    Math.min(a.minY, b.minY),
    Math.max(a.maxY, b.maxY)
  );
};

/**
 * Computes the union of multiple bounding boxes
 */
export const unionAll = (...bboxes: BoundingBox[]): BoundingBox => {
  if (bboxes.length === 0) {
    return bbox(0, 0, 0, 0);
  }

  return bbox(
    Math.min(...bboxes.map((b) => b.minX)),
    Math.max(...bboxes.map((b) => b.maxX)),
    Math.min(...bboxes.map((b) => b.minY)),
    Math.max(...bboxes.map((b) => b.maxY))
  );
};

/**
 * Creates an empty bounding box that can be used as a starting point for unioning.
 * All dimensions are set to Infinity/-Infinity so that the first union will
 * replace them with actual values.
 */
export const empty = (): BoundingBox => {
  return {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  };
};

/**
 * Checks if a bounding box is empty (has Infinity values from empty())
 */
export const isEmptyInfinity = (bbox: BoundingBox): boolean => {
  return (
    bbox.minX === Infinity ||
    bbox.maxX === -Infinity ||
    bbox.minY === Infinity ||
    bbox.maxY === -Infinity
  );
};
