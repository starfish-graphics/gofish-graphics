/* 
1. Supports direct and data style.

2. Supports `v` syntax. (TODO)

*/

import type { JSX } from "solid-js";
import { GoFishAST } from "./_ast";
import { GoFishNode } from "./_node";
import _, { ListOfRecursiveArraysOrValues } from "lodash";
import { ChartBuilder } from "./marks/chart";
import type { LayerContext } from "./marks/chart";
import {
  ChannelAnnotations,
  DeriveMarkProps,
  inferSize,
  inferColor,
} from "./channels";
import { Mark } from "./types";

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
 * A Promise-like object that also has chainable methods from GoFishNode.
 * This allows calling .render(), .name(), .setKey(), .setShared() on promises returned by withGoFish.
 */
export interface PromiseWithRender<T> extends Promise<T> {
  render(
    container: HTMLElement,
    options: RenderOptions
  ): HTMLElement | Promise<HTMLElement>;
  name(name: string): PromiseWithRender<T>;
  setKey(key: string): PromiseWithRender<T>;
  setShared(shared: [boolean, boolean]): PromiseWithRender<T>;
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
 * Wraps a Promise to add chainable methods that proxy to GoFishNode.
 * This allows calling .render(), .name(), .setKey(), .setShared() on promises.
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

  // Add chainable methods that return new PromiseWithRender
  (promise as any).name = function (name: string): PromiseWithRender<T> {
    return addRenderMethod(
      promise.then((result) => {
        if (result instanceof GoFishNode) {
          return result.name(name) as T;
        }
        return result;
      })
    );
  };

  (promise as any).setKey = function (key: string): PromiseWithRender<T> {
    return addRenderMethod(
      promise.then((result) => {
        if (result instanceof GoFishNode) {
          return result.setKey(key) as T;
        }
        return result;
      })
    );
  };

  (promise as any).setShared = function (
    shared: [boolean, boolean]
  ): PromiseWithRender<T> {
    return addRenderMethod(
      promise.then((result) => {
        if (result instanceof GoFishNode) {
          return result.setShared(shared) as T;
        }
        return result;
      })
    );
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
  )[],
  layerContext?: LayerContext
): Promise<GoFishAST[]> {
  // if the child is a thunked promise, it must be resolved before the next child is resolved
  const resolved: GoFishAST[] = [];
  const sharedLayerContext = layerContext ?? {};

  for (const child of children) {
    if (typeof child === "function") {
      // It's a thunk, call it and await if it returns a promise
      const result = child();
      const resolvedChild = result instanceof Promise ? await result : result;
      if (resolvedChild != null) {
        // If it's a ChartBuilder, resolve it
        if (isChartBuilder(resolvedChild)) {
          const node = await resolvedChild
            .withLayerContext(sharedLayerContext)
            .resolve();
          resolved.push(node);
        } else {
          resolved.push(resolvedChild);
        }
      }
    } else if (isChartBuilder(child)) {
      // If it's a ChartBuilder, resolve it sequentially
      const node = await child.withLayerContext(sharedLayerContext).resolve();
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
export function createOperator<T extends Record<string, any>, R>(
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
          `createOperator: Expected 0, 1, or 2 arguments, got ${args.length}`
        );
      }
      // Flatten nested structures and await all promises
      const flattened = await flattenAndAwaitPromises<
        GoFishAST | Promise<GoFishAST> | ChartBuilder<any, any>
      >(children);
      const layerContext: LayerContext = {};
      // Resolve any ChartBuilder instances and filter out promises
      const resolvedBuilders = await Promise.all(
        flattened.map(async (child) => {
          if (isChartBuilder(child)) {
            return await child.withLayerContext(layerContext).resolve();
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
export function createOperatorSequential<T extends Record<string, any>, R>(
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
          `createOperatorSequential: Expected 0, 1, or 2 arguments, got ${args.length}`
        );
      }
      // First phase: flatten nested structures and await promises, preserving thunks and ChartBuilder instances
      const flattenedWithThunks = await flattenAndAwaitPromises<
        | GoFishAST
        | (() => GoFishAST | Promise<GoFishAST>)
        | ChartBuilder<any, any>
      >(children);
      const layerContext: LayerContext = {};
      // Second phase: process thunks and ChartBuilder instances sequentially
      const resolvedChildren =
        await reifyChildrenSequentially(flattenedWithThunks, layerContext);
      return func(opts, resolvedChildren);
    })();
    return addRenderMethod(promise);
  };
}

/**
 * Creates a high-level mark function from a low-level shape function
 * and channel annotations.
 *
 * Channel annotations describe how each prop encodes data:
 * - "size": mark accepts `number | keyof T`, uses inferSize to convert
 * - "color": mark accepts `string | keyof T`, uses inferColor to convert
 * - unannotated props are passed through unchanged
 */
export function createMark<
  ShapeProps extends Record<string, any>,
  C extends ChannelAnnotations<ShapeProps>,
>(
  shapeFn: (opts: ShapeProps) => GoFishNode,
  channels: C
): <T extends Record<string, any>>(
  opts: DeriveMarkProps<ShapeProps, C, T>
) => Mark<T | T[] | { item: T | T[]; key: number | string }> {
  return <T extends Record<string, any>>(
    markOpts: DeriveMarkProps<ShapeProps, C, T>
  ): Mark<T | T[] | { item: T | T[]; key: number | string }> => {
    return async (
      input: T | T[] | { item: T | T[]; key: number | string }
    ) => {
      // Unwrap input: handles T, T[], or { item, key } patterns
      let d: T | T[], key: number | string | undefined;
      if (typeof input === "object" && input !== null && "item" in input) {
        d = (input as { item: T | T[]; key: number | string }).item;
        key = (input as { item: T | T[]; key: number | string }).key;
      } else {
        d = input as T | T[];
        key = undefined;
      }

      if ((markOpts as any).debug) {
        console.log("mark", key, d);
      }

      const data = Array.isArray(d) ? d : [d];

      // Build shape props by encoding each channel
      const shapeProps: Record<string, any> = {};
      for (const propName of Object.keys(markOpts as any)) {
        if (propName === "debug") continue;
        const channelType = channels[propName as keyof C];
        const markValue = (markOpts as any)[propName];

        if (channelType === "size") {
          shapeProps[propName] = inferSize(markValue, data);
        } else if (channelType === "color") {
          shapeProps[propName] = inferColor(markValue, data);
        } else {
          shapeProps[propName] = markValue;
        }
      }

      const node = shapeFn(shapeProps as ShapeProps);
      node.name(key?.toString() ?? "");
      (node as any).datum = d;
      return node;
    };
  };
}
