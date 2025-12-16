/* 
1. Supports direct and data style.

2. Supports `v` syntax. (TODO)

*/

import type { JSX } from "solid-js";
import { GoFishAST } from "./_ast";
import { GoFishNode } from "./_node";
import _, { ListOfRecursiveArraysOrValues } from "lodash";
import { ChartBuilder } from "./marks/chart";

/**
 * Options for rendering a GoFish node
 */
export interface RenderOptions {
  w: number;
  h: number;
  x?: number;
  y?: number;
  transform?: { x?: number; y?: number };
  debug?: boolean;
  defs?: JSX.Element[];
  axes?: boolean;
}

/**
 * Children input type that can be a recursive structure, a promise of it, or null
 */
type GoFishChildrenInput =
  | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
  | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
  | null;

/**
 * Children input type with thunks that can be a recursive structure, a promise of it, or null
 */
type GoFishChildrenInputWithThunks =
  | ListOfRecursiveArraysOrValues<
      GoFishAST | Promise<GoFishAST> | (() => GoFishAST | Promise<GoFishAST>)
    >
  | Promise<
      ListOfRecursiveArraysOrValues<
        GoFishAST | Promise<GoFishAST> | (() => GoFishAST | Promise<GoFishAST>)
      >
    >
  | null;

/**
 * A Promise-like object that also has a render method.
 * This allows calling .render() on promises returned by withGoFish and withLayerSequential.
 */
export interface PromiseWithRender<T> extends Promise<T> {
  render(
    container: HTMLElement,
    options: RenderOptions
  ): HTMLElement | Promise<HTMLElement>;
}

/**
 * Type guard to check if a value has a render method like GoFishNode
 */
function hasRenderMethod(value: any): value is GoFishNode {
  return value instanceof GoFishNode && typeof value.render === "function";
}

/**
 * Type guard to check if value is a ChartBuilder
 */
function isChartBuilder(value: any): value is ChartBuilder<any, any> {
  return value instanceof ChartBuilder;
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
    options: RenderOptions
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
 * Recursively flattens nested structures and awaits all promises, returning a flat array.
 * If the type includes functions (thunks), they are preserved (not called).
 * Always returns a flat array.
 * ChartBuilder instances are automatically resolved.
 */
async function flattenAndAwaitPromises<T>(
  value:
    | T
    | Promise<T>
    | ListOfRecursiveArraysOrValues<T | Promise<T>>
    | Promise<ListOfRecursiveArraysOrValues<T | Promise<T>>>
    | null
    | undefined
): Promise<T[]> {
  if (value === null || value === undefined) {
    return [];
  }

  // If it's a promise, await it first
  if (value instanceof Promise) {
    const resolved = await value;
    return flattenAndAwaitPromises(resolved);
  }

  // If it's a ChartBuilder, preserve it (don't resolve here)
  // ChartBuilder instances should be resolved sequentially in reifyChildrenSequentially
  // For non-sequential contexts, they'll be resolved when processed
  if (isChartBuilder(value)) {
    return [value as T];
  }

  // If it's an array, recursively await all elements
  if (Array.isArray(value)) {
    const awaited = await Promise.all(
      value.map((item) => flattenAndAwaitPromises(item))
    );
    return _.flattenDeep(awaited) as T[];
  }

  // Otherwise, return as single-element array
  return [value as T];
}

/**
 * Process children sequentially, calling thunks and awaiting promises one at a time
 * ChartBuilder instances are automatically resolved sequentially
 */
export async function reifyChildrenSequentially(
  children: (
    | GoFishAST
    | (() => GoFishAST | Promise<GoFishAST>)
    | ChartBuilder<any, any>
  )[]
): Promise<GoFishAST[]> {
  // if the child is a thunked promise, it must be resolved before the next child is resolved
  const resolved: GoFishAST[] = [];

  for (const child of children) {
    if (typeof child === "function") {
      // It's a thunk, call it and await if it returns a promise
      const result = child();
      const resolvedChild = result instanceof Promise ? await result : result;
      if (resolvedChild != null) {
        // If it's a ChartBuilder, resolve it
        if (isChartBuilder(resolvedChild)) {
          const node = await resolvedChild.resolve();
          resolved.push(node);
        } else {
          resolved.push(resolvedChild);
        }
      }
    } else if (isChartBuilder(child)) {
      // If it's a ChartBuilder, resolve it sequentially
      const node = await child.resolve();
      resolved.push(node);
    } else {
      // It's already a GoFishAST, add it directly
      resolved.push(child);
    }
  }

  return resolved;
}

/* 
- Flattens deeply nested children
- Allows opts to be optional
- Supports arrays where individual elements can be promises
*/
export function withGoFish<T extends Record<string, any>, R>(
  func: (opts: T, children: GoFishAST[]) => R
): {
  (opts?: T, children?: GoFishChildrenInput): PromiseWithRender<R>;
  (children: GoFishChildrenInput): PromiseWithRender<R>;
} {
  return function (...args: any[]): PromiseWithRender<R> {
    const promise = (async () => {
      let opts: T;
      let children: GoFishChildrenInput | undefined;
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
      // Flatten nested structures and await all promises
      const flattened = await flattenAndAwaitPromises<
        GoFishAST | Promise<GoFishAST> | ChartBuilder<any, any>
      >(children);
      // Resolve any ChartBuilder instances and filter out promises
      const resolvedBuilders = await Promise.all(
        flattened.map(async (child) => {
          if (isChartBuilder(child)) {
            return await child.resolve();
          }
          return child;
        })
      );
      const flatChildren = resolvedBuilders.filter(
        (child): child is GoFishAST =>
          child != null && !(child instanceof Promise)
      ) as GoFishAST[];
      return func(opts, flatChildren);
    })();
    return addRenderMethod(promise);
  };
}

/**
 * Sequential version of withGoFish that supports thunks (functions) in children.
 * Processes thunks sequentially (one at a time) rather than in parallel.
 *
 * - Flattens deeply nested children
 * - Allows opts to be optional
 * - Supports arrays where individual elements can be promises or thunks
 * - Processes thunks sequentially to ensure proper execution order
 */
export function withGoFishSequential<T extends Record<string, any>, R>(
  func: (opts: T, children: GoFishAST[]) => R
): {
  (opts?: T, children?: GoFishChildrenInputWithThunks): PromiseWithRender<R>;
  (children: GoFishChildrenInputWithThunks): PromiseWithRender<R>;
} {
  return function (...args: any[]): PromiseWithRender<R> {
    const promise = (async () => {
      let opts: T;
      let children: GoFishChildrenInputWithThunks | undefined;
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
          `withGoFishSequential: Expected 0, 1, or 2 arguments, got ${args.length}`
        );
      }
      // First phase: flatten nested structures and await promises, preserving thunks and ChartBuilder instances
      const flattenedWithThunks = await flattenAndAwaitPromises<
        | GoFishAST
        | (() => GoFishAST | Promise<GoFishAST>)
        | ChartBuilder<any, any>
      >(children);
      // Second phase: process thunks and ChartBuilder instances sequentially
      const resolvedChildren =
        await reifyChildrenSequentially(flattenedWithThunks);
      return func(opts, resolvedChildren);
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
