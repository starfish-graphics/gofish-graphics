/* 
1. Supports direct and data style.

2. Supports `v` syntax. (TODO)

*/

import { GoFishAST } from "./_ast";
import _, { ListOfRecursiveArraysOrValues } from "lodash";

/* 
- Flattens deeply nested children
- Allows opts to be optional
*/
export function withGoFish<T extends Record<string, any>, R>(
  func: (opts: T, children: GoFishAST[]) => R
): {
  (
    opts?: T,
    children?:
      | ListOfRecursiveArraysOrValues<GoFishAST>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST>>
      | null
  ): Promise<R>;
  (
    children:
      | ListOfRecursiveArraysOrValues<GoFishAST>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST>>
      | null
  ): Promise<R>;
} {
  return async function (...args: any[]): Promise<R> {
    let opts: T;
    let children:
      | ListOfRecursiveArraysOrValues<GoFishAST>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST>>
      | null
      | undefined;
    if (args.length === 2) {
      opts = args[0] ?? ({} as T);
      children = args[1];
    } else if (args.length === 1) {
      opts = {} as T;
      children = args[0];
    } else if (args.length === 0) {
      opts = {} as T;
      children = undefined;
    } else {
      throw new Error(
        `withGoFish: Expected 0, 1, or 2 arguments, got ${args.length}`
      );
    }
    // Flatten deeply nested children
    const flatChildren = _.flattenDeep(await children);
    return func(opts, flatChildren);
  };
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
      throw new Error(
        `withGoFishNoChildren: Expected 1 or 2 arguments, got ${args.length}`
      );
    }
  } as any;
}
