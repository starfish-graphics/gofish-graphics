import { findTargetMonotonic } from "../util";

export type Monotonic = {
  kind: "linear" | "unknown";
  run: (x: number) => number;
  inverse: (
    x: number,
    options?: {
      tolerance?: number;
      maxIterations?: number;
      lowerBound?: number;
      upperBoundGuess?: number;
    }
  ) => number | undefined;
};

/**
 * Linear object representing a linear function y = slope * x + intercept
 */
export interface Linear extends Monotonic {
  kind: "linear";
  slope: number;
  intercept: number;
}

export interface Unknown extends Monotonic {
  kind: "unknown";
}

export function linear(slope: number, intercept: number): Linear {
  return {
    kind: "linear",
    slope,
    intercept,
    run: (x: number) => slope * x + intercept,
    inverse: (y: number) => (slope === 0 ? undefined : (y - intercept) / slope),
  };
}

export const isLinear = (x: Monotonic): x is Linear => {
  return x.kind === "linear";
};

export const unknown = (run: (x: number) => number): Unknown => {
  return {
    kind: "unknown",
    run,
    inverse: (
      y: number,
      options?: {
        tolerance?: number;
        maxIterations?: number;
        lowerBound?: number;
        upperBoundGuess?: number;
      }
    ) => findTargetMonotonic(y, run, options),
  };
};

export const isUnknown = (x: Monotonic): x is Unknown => {
  return x.kind === "unknown";
};

export const add = (...args: Monotonic[]): Monotonic => {
  if (args.every(isLinear)) {
    return linear(
      args.reduce((sum, arg) => sum + arg.slope, 0),
      args.reduce((sum, arg) => sum + arg.intercept, 0)
    );
  } else {
    return unknown((x: number) =>
      args.reduce((sum, arg) => sum + arg.run(x), 0)
    );
  }
};

export const smul = (scalar: number, fn: Monotonic): Monotonic => {
  if (isLinear(fn)) {
    return linear(scalar * fn.slope, scalar * fn.intercept);
  } else {
    return unknown((x: number) => scalar * fn.run(x));
  }
};

export const adds = (fn: Monotonic, scalar: number): Monotonic => {
  if (isLinear(fn)) {
    return linear(fn.slope, fn.intercept + scalar);
  } else {
    return unknown((x: number) => fn.run(x) + scalar);
  }
};

export const max = (...args: Monotonic[]): Monotonic => {
  if (
    args.every(isLinear) &&
    args.every((arg) => arg.intercept === args[0].intercept)
  ) {
    return linear(Math.max(...args.map((arg) => arg.slope)), args[0].intercept);
  } else {
    return unknown((x: number) => Math.max(...args.map((arg) => arg.run(x))));
  }
};
