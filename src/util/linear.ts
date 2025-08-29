// A simple linear module. Import like so:
// import * as Linear from "../util/linear"

/**
 * Linear object representing a linear function y = mx + b
 */
export interface Linear {
  /** The slope of the line (m) */
  slope: number;
  /** The y-intercept of the line (b) */
  intercept: number;
}

/**
 * Creates a new Linear object
 * @param slope - The slope of the line
 * @param intercept - The y-intercept of the line
 * @returns A new Linear object
 */
export function mk(slope: number, intercept: number): Linear {
  return { slope, intercept };
}

/**
 * Evaluates the linear function at a given x value
 * @param linear - The Linear object
 * @param x - The x value to evaluate at
 * @returns The y value (y = mx + b)
 */
export function evaluate(linear: Linear, x: number): number {
  return linear.slope * x + linear.intercept;
}

/**
 * Creates the inverse of a linear function
 * @param linear - The Linear object
 * @returns A new Linear object representing the inverse function
 * @throws Error if slope is 0 (function is not invertible)
 */
export function inverse(linear: Linear): Linear {
  if (linear.slope === 0) {
    throw new Error("Cannot invert a horizontal line (slope = 0)");
  }

  // If y = mx + b, then x = (y - b) / m
  // So the inverse has slope = 1/m and intercept = -b/m
  return {
    slope: 1 / linear.slope,
    intercept: -linear.intercept / linear.slope,
  };
}
