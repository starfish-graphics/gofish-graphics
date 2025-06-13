/* 
1. Supports direct and data style.

2. Supports `v` syntax. (TODO)

*/

import { GoFishAST } from "./_ast";

/**
 * Wraps a function that takes (opts, children) to support both calling patterns:
 * - Original: func(opts, children)
 * - Data style: func(data, opts, callback) which compiles to func(opts, data.map(callback))
 */
export function withGoFish<T extends Record<string, any>, R>(
  func: (opts: T, children: GoFishAST[]) => R
): {
  (opts: T, children: GoFishAST[]): R;
  (data: any[], opts: T, callback: (d: any, i?: string | number) => GoFishAST): R;
} {
  return function (...args: any[]): R {
    if (args.length === 2) {
      // Original calling pattern: func(opts, children)
      const [opts, children] = args;
      return func(opts, children);
    } else if (args.length === 3) {
      // Data style calling pattern: func(data, opts, callback)
      const [data, opts, callback] = args;
      const children = data.map(callback);
      return func(opts, children);
    } else {
      throw new Error(`withGoFish: Expected 2 or 3 arguments, got ${args.length}`);
    }
  } as any;
}

/**
 * Wraps a function that takes only (opts) to support both calling patterns:
 * - Original: func(opts)
 * - Data style: func(data, opts) where data is passed through (for future use)
 */
export function withGoFishNoChildren<T extends Record<string, any>, R>(
  func: (opts: T) => R
): {
  (opts: T): R;
  (data: any[], opts: T): R;
} {
  return function (...args: any[]): R {
    if (args.length === 1) {
      // Original calling pattern: func(opts)
      const [opts] = args;
      return func(opts);
    } else if (args.length === 2) {
      // Data style calling pattern: func(data, opts) - data is passed through for now
      const [data, opts] = args;
      return func(opts);
    } else {
      throw new Error(`withGoFishNoChildren: Expected 1 or 2 arguments, got ${args.length}`);
    }
  } as any;
}
