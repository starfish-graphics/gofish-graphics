export type Interval = {
  min: number;
  max: number;
};

/**
 * Creates an interval from min and max values
 */
export function interval(min: number, max: number): Interval {
  return { min, max };
}

/**
 * Checks if an interval is valid (min <= max)
 */
export const isValid = (interval: Interval): boolean => {
  return interval.min <= interval.max;
};

/**
 * Checks if an interval is empty (min > max)
 */
export const isEmpty = (interval: Interval): boolean => {
  return interval.min > interval.max;
};

/**
 * Gets the width of an interval
 */
export const width = (interval: Interval): number => {
  return interval.max - interval.min;
};

/**
 * Checks if a value is contained within an interval
 */
export const contains = (interval: Interval, value: number): boolean => {
  return value >= interval.min && value <= interval.max;
};

/**
 * Checks if two intervals overlap
 */
export const overlaps = (a: Interval, b: Interval): boolean => {
  return a.min <= b.max && b.min <= a.max;
};

/**
 * Computes the union of two intervals
 */
export const union = (a: Interval, b: Interval): Interval => {
  return interval(Math.min(a.min, b.min), Math.max(a.max, b.max));
};

/**
 * Computes the union of multiple intervals
 */
export const unionAll = (...intervals: Interval[]): Interval => {
  if (intervals.length === 0) {
    return interval(0, 0);
  }

  return intervals.reduce((acc, interval) => union(acc, interval));
};

export const toJSON = (interval: Interval): string => {
  return `[${interval.min}, ${interval.max}]`;
};
