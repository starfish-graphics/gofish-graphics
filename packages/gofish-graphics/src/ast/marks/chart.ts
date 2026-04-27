import { sumBy, v, Connect, ref } from "../../lib";
import { GoFishNode } from "../_node";
import { type ColorConfig } from "../colorSchemes";

export type { ColorConfig };
import { inferSize } from "../channels";
import { rect as generatedRect } from "../shapes/rect";
import { Ellipse } from "../shapes/ellipse";
import { Mark, Operator } from "../types";
import type { LabelAccessor, LabelOptions } from "../labels/labelPlacement";
import {
  resolveMarkResult,
  nameableMark,
  LayerContext,
} from "./createOperator";

export type { Mark, Operator };
export { generatedRect as rect };
export type { LayerContext };

import { ChartBuilder, LayerSelector, chart } from "./chartBuilder";
import type { ChartOptions } from "./chartBuilder";
export { ChartBuilder, LayerSelector, chart };
export type { ChartOptions };

/* Data Transformation Operators */
export function derive<T, U>(fn: (d: T) => U | Promise<U>): Operator<T, U> {
  return async (mark: Mark<U>) => {
    return (async (
      d: T,
      key?: string | number,
      layerContext?: LayerContext
    ) => {
      return mark(await fn(d), key, layerContext);
    }) as Mark<T>;
  };
}

// return an array of copies of `d` repeated `d.field` times
export const repeat = <T, K extends keyof T>(
  d: T,
  field: K & (T[K] extends number ? K : never)
) => {
  return Array.from({ length: d[field] as unknown as number }, () => d);
};

export { chunk } from "lodash";

export const normalize = <T, K extends keyof T>(
  data: T[],
  field: K & (T[K] extends number ? K : never)
): T[] => {
  const total = sumBy(data, field as string);
  return data.map((d) => ({
    ...d,
    [field]: (d[field] as unknown as number) / total,
  }));
};

export function log<T>(label?: string): Operator<T, T> {
  return async (mark: Mark<T>) => {
    return (async (
      d: T,
      key?: string | number,
      layerContext?: LayerContext
    ) => {
      if (label) {
        console.log(label, d);
      } else {
        console.log(d);
      }
      return mark(d, key, layerContext);
    }) as Mark<T>;
  };
}

/* END Data Transformation Operators */

export function circle<T extends Record<string, any>>({
  r,
  fill,
  stroke,
  strokeWidth,
  debug,
}: {
  r?: number;
  fill?: string | keyof T;
  stroke?: string;
  strokeWidth?: number;
  debug?: boolean;
}): Mark<T> & {
  name(layerName: string): Mark<T>;
  label(accessor: LabelAccessor, options?: LabelOptions): Mark<T>;
} {
  const base: Mark<T> = async (
    d: T,
    key?: string | number,
    _layerContext?: LayerContext
  ) => {
    if (debug) console.log("circle", key, d);
    // scatter passes an array of items; unwrap to first element for field lookup
    const datum: Record<string, any> = Array.isArray(d) ? (d as any[])[0] : d;
    const resolvedFill =
      typeof fill === "string" && datum && fill in datum
        ? v(datum[fill as string])
        : fill;
    const resolvedStroke =
      typeof stroke === "string" && datum && stroke in datum
        ? v(datum[stroke as string])
        : stroke;
    const node = Ellipse({
      w: typeof r === "number" ? r * 2 : inferSize(r, d),
      h: typeof r === "number" ? r * 2 : inferSize(r, d),
      aspectRatio: 1,
      fill: resolvedFill,
      stroke: resolvedStroke,
      strokeWidth,
    }).name(key?.toString() ?? "");
    (node as any).datum = d;
    return node;
  };
  return nameableMark(base);
}

// select() returns a lazy selector that defers layer lookup until actually needed
// This allows layers to be registered by .name() on marks before select() tries to access them
export function select<T>(layerName: string): LayerSelector<T> {
  return new LayerSelector<T>(layerName);
}

// line() mark connects data points using center-to-center mode
export function line<T extends Record<string, any>>(options?: {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  interpolation?: "linear" | "bezier";
}): Mark<Array<T & { __ref?: GoFishNode }>> {
  return async (
    d: Array<T & { __ref?: GoFishNode }>,
    key?: string | number,
    _layerContext?: LayerContext
  ) => {
    // Use refs from enriched data (lazy resolution via __ref)
    const refs = d.map((item) => {
      if ("__ref" in item && item.__ref) {
        return ref(item.__ref);
      }
      throw new Error("line mark expected __ref on items");
    });

    return Connect(
      {
        direction: 0, // x direction
        mode: "center",
        stroke: options?.stroke,
        strokeWidth: options?.strokeWidth ?? 1,
        opacity: options?.opacity,
        interpolation: options?.interpolation ?? "linear",
      },
      refs
    );
  };
}

// area() mark connects data points using edge-to-edge mode
export function area<T extends Record<string, any>>(options?: {
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  mixBlendMode?: "normal" | "multiply";
  dir?: "x" | "y";
  interpolation?: "linear" | "bezier";
}): Mark<Array<T & { __ref?: GoFishNode }>> {
  return async (
    d: Array<T & { __ref?: GoFishNode }>,
    key?: string | number,
    _layerContext?: LayerContext
  ) => {
    // Use refs from enriched data (lazy resolution via __ref)
    const refs = d.map((item) => {
      if ("__ref" in item && item.__ref) {
        return ref(item.__ref);
      }
      throw new Error("area mark expected __ref on items");
    });

    return Connect(
      {
        direction: options?.dir ?? "x",
        mode: "edge",
        mixBlendMode: options?.mixBlendMode ?? "normal",
        stroke: options?.stroke,
        strokeWidth: options?.strokeWidth ?? 0,
        opacity: options?.opacity,
        interpolation: options?.interpolation ?? "bezier",
      },
      refs
    );
  };
}

// blank() mark creates invisible guides for positioning
export function blank<T extends Record<string, any>>({
  emX,
  emY,
  w = 0,
  h = 0,
  rx,
  ry,
  fill,
  debug,
  stroke,
  strokeWidth,
}: {
  emX?: boolean;
  emY?: boolean;
  w?: number | (keyof T & string);
  h?: number | (keyof T & string);
  rx?: number;
  ry?: number;
  fill?: string | (keyof T & string);
  stroke?: string;
  strokeWidth?: number;
  debug?: boolean;
} = {}): Mark<T | T[] | { item: T | T[]; key: number | string }> {
  // blank is essentially a transparent/zero-size rect
  return generatedRect({
    emX,
    emY,
    w,
    h,
    rx,
    ry,
    fill,
    debug,
    stroke,
    strokeWidth,
  });
}
