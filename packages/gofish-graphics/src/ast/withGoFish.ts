/* 
1. Supports direct and data style.

2. Supports `v` syntax. (TODO)

*/

import type { JSX } from "solid-js";
import { GoFishAST } from "./_ast";
import { GoFishNode } from "./_node";
import _, { ListOfRecursiveArraysOrValues } from "lodash";

/**
 * A Promise-like object that also has a render method.
 * This allows calling .render() on promises returned by withGoFish and withLayerSequential.
 */
export interface PromiseWithRender<T> extends Promise<T> {
  render(
    container: HTMLElement,
    options: {
      w: number;
      h: number;
      x?: number;
      y?: number;
      transform?: { x?: number; y?: number };
      debug?: boolean;
      defs?: JSX.Element[];
      axes?: boolean;
    }
  ): HTMLElement | Promise<HTMLElement>;
}

/**
 * Type guard to check if a value has a render method like GoFishNode
 */
function hasRenderMethod(value: any): value is GoFishNode {
  return value instanceof GoFishNode && typeof value.render === "function";
}

/**
 * Wraps a Promise to add a render method.
 * The render method will await the promise and call render on the result if it's a GoFishNode.
 */
export function addRenderMethod<T>(promise: Promise<T>): PromiseWithRender<T> {
  // Add the render method directly to the promise object
  // In JavaScript, you can add properties to any object, including Promises
  (promise as any).render = function (
    container: HTMLElement,
    options: {
      w: number;
      h: number;
      x?: number;
      y?: number;
      transform?: { x?: number; y?: number };
      debug?: boolean;
      defs?: JSX.Element[];
      axes?: boolean;
    }
  ): HTMLElement | Promise<HTMLElement> {
    return promise.then((result) => {
      // Check if the result has a render method (like GoFishNode)
      if (hasRenderMethod(result)) {
        return result.render(container, options);
      }
      throw new Error(
        "Cannot call render on this result. Only GoFishNode instances have a render method."
      );
    });
  };

  return promise as PromiseWithRender<T>;
}

/**
 * Recursively awaits all promises in a nested structure
 */
async function awaitAllPromises<T>(
  value:
    | T
    | Promise<T>
    | ListOfRecursiveArraysOrValues<T | Promise<T>>
    | null
    | undefined
): Promise<ListOfRecursiveArraysOrValues<T>> {
  if (value === null || value === undefined) {
    return [] as ListOfRecursiveArraysOrValues<T>;
  }

  // If it's a promise, await it first
  if (value instanceof Promise) {
    const resolved = await value;
    return awaitAllPromises(resolved);
  }

  // If it's an array, recursively await all elements
  if (Array.isArray(value)) {
    const awaited = await Promise.all(
      value.map((item) => awaitAllPromises(item))
    );
    return _.flattenDeep(awaited) as ListOfRecursiveArraysOrValues<T>;
  }

  // Otherwise, return as-is (single value is valid in ListOfRecursiveArraysOrValues)
  return value as ListOfRecursiveArraysOrValues<T>;
}

/* 
- Flattens deeply nested children
- Allows opts to be optional
- Supports arrays where individual elements can be promises
*/
export function withGoFish<T extends Record<string, any>, R>(
  func: (opts: T, children: GoFishAST[]) => R
): {
  (
    opts?: T,
    children?:
      | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
      | null
  ): PromiseWithRender<R>;
  (
    children:
      | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
      | null
  ): PromiseWithRender<R>;
} {
  return function (...args: any[]): PromiseWithRender<R> {
    const promise = (async () => {
      let opts: T;
      let children:
        | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
        | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
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
      // Await all promises in the structure, then flatten deeply nested children
      const awaitedChildren = await awaitAllPromises(children);
      const flattened = _.flattenDeep(awaitedChildren) as any[];
      const flatChildren = flattened.filter(
        (child): child is GoFishAST => child != null
      );
      return func(opts, flatChildren);
    })();
    return addRenderMethod(promise);
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
