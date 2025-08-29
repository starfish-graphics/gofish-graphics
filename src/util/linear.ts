// A simple linear module. Import like so:
// import * as Linear from "../util/linear"

import * as Unknown from "./unknown";

/**
 * Linear object representing a linear function y = mx + b
 */
export interface Linear {
  kind: "linear";
  /** The slope of the line (m) */
  slope: number;
  /** The y-intercept of the line (b) */
  intercept: number;
  run: (x: number) => number;
}

/**
 * Creates a new Linear object
 * @param slope - The slope of the line
 * @param intercept - The y-intercept of the line
 * @returns A new Linear object
 */
export function mk(slope: number, intercept: number): Linear {
  return {
    kind: "linear",
    slope,
    intercept,
    run: (x: number) => slope * x + intercept,
  };
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
    throw new Error(
      `Cannot invert a horizontal line (slope = 0, intercept = ${linear.intercept})`
    );
  }

  // If y = mx + b, then x = (y - b) / m
  // So the inverse has slope = 1/m and intercept = -b/m
  return mk(1 / linear.slope, -linear.intercept / linear.slope);
}

export const isLinear = (x: unknown): x is Linear => {
  return (
    typeof x === "object" &&
    x !== null &&
    "kind" in x &&
    (x as any).kind === "linear"
  );
};

export const sum = (...args: Linear[]): Linear => {
  return mk(
    args.reduce((sum, arg) => sum + arg.slope, 0),
    args.reduce((sum, arg) => sum + arg.intercept, 0)
  );
};

// TODO: use this to simplify code. also suggests putting Linear and Unknown in a single type...
export const max = (...args: Linear[]): Linear | Unknown.Unknown => {
  if (args.every((arg) => arg.intercept === args[0].intercept)) {
    return mk(Math.max(...args.map((arg) => arg.slope)), args[0].intercept);
  } else {
    return Unknown.mk((x: number) =>
      Math.max(...args.map((arg) => arg.run(x)))
    );
  }
};
