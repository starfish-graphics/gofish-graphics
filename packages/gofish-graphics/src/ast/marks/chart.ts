import {
  Frame,
  Spread,
  Stack,
  Scatter,
  Table,
  sumBy,
  v,
  meanBy,
  Connect,
  ref,
} from "../../lib";
import { GoFishNode } from "../_node";
import { GoFishAST } from "../_ast";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { type ColorConfig } from "../colorSchemes";

export type { ColorConfig };
import { inferSize, inferPos } from "../channels";
import { MaybeValue } from "../data";
import { ScatterProps } from "../graphicalOperators/scatter";
import { Rect } from "../shapes/rect";
import { rect as generatedRect } from "../shapes/rect";
import { Ellipse } from "../shapes/ellipse";
import { Mark, Operator } from "../types";
import type {
  LabelAccessor,
  LabelOptions,
  LabelSpec,
} from "../labels/labelPlacement";
import {
  createOperator,
  LayoutFn,
  resolveMarkResult,
  nameableMark,
  LayerContext,
} from "./createOperator";

export type { Mark, Operator };
export { generatedRect as rect };
export type { LayerContext };

// LayerSelector is a lazy selector that defers layer lookup until actually needed
export class LayerSelector<T = any> {
  constructor(public readonly layerName: string) {}

  // Resolve the selector to actual data - throws if layer not found
  resolve(layerContext: LayerContext): Array<T & { __ref: GoFishNode }> {
    const layer = layerContext[this.layerName];

    if (!layer) {
      throw new Error(
        `Layer "${this.layerName}" not found. Make sure to call .name("${this.layerName}") on the mark first.`
      );
    }

    // Try to resolve nodes from keyContext (which points to laid-out nodes)
    // If keyContext is not available, fall back to stored nodes
    let resolvedNodes: GoFishNode[] = layer.nodes;

    // Return node-attached data enriched with refs to nodes.
    // Option 3: flatten arrays and duplicate __ref per underlying datum.
    const result = resolvedNodes.flatMap((node: GoFishNode) => {
      const datum: any = (node as any).datum;

      // Always convert datum to an array of node-attached objects for consistency.
      if (!Array.isArray(datum) && typeof datum !== "object") {
        throw new Error("datum must be an array or object");
      }
      const arr = Array.isArray(datum) ? datum : [datum];

      return arr.map((item: any) => ({
        ...(item as object),
        __ref: node,
      })) as Array<T & { __ref: GoFishNode }>;
    });
    return result;
  }
}

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

export type ChartOptions = {
  w?: number;
  h?: number;
  coord?: CoordinateTransform;
  color?: ColorConfig;
};

export class ChartBuilder<TInput, TOutput = TInput> {
  private readonly data: TInput;
  private readonly options?: ChartOptions;
  private readonly operators: Operator<any, any>[] = [];
  private readonly finalMark?: Mark<TOutput>;
  private readonly layerContext: LayerContext;
  private readonly nodeZOrder?: number;

  constructor(
    data: TInput,
    options?: ChartOptions,
    operators: Operator<any, any>[] = [],
    finalMark?: Mark<TOutput>,
    layerContext: LayerContext = {},
    nodeZOrder?: number
  ) {
    this.data = data;
    this.options = options;
    this.operators = operators;
    this.finalMark = finalMark;
    this.layerContext = layerContext;
    this.nodeZOrder = nodeZOrder;
  }

  // flow accumulates operators and returns a new builder for chaining
  flow<T1>(op1: Operator<TInput, T1>): ChartBuilder<TInput, T1>;
  flow<T1, T2>(
    op1: Operator<TInput, T1>,
    op2: Operator<T1, T2>
  ): ChartBuilder<TInput, T2>;
  flow<T1, T2, T3>(
    op1: Operator<TInput, T1>,
    op2: Operator<T1, T2>,
    op3: Operator<T2, T3>
  ): ChartBuilder<TInput, T3>;
  flow<T1, T2, T3, T4>(
    op1: Operator<TInput, T1>,
    op2: Operator<T1, T2>,
    op3: Operator<T2, T3>,
    op4: Operator<T3, T4>
  ): ChartBuilder<TInput, T4>;
  flow<T1, T2, T3, T4, T5>(
    op1: Operator<TInput, T1>,
    op2: Operator<T1, T2>,
    op3: Operator<T2, T3>,
    op4: Operator<T3, T4>,
    op5: Operator<T4, T5>
  ): ChartBuilder<TInput, T5>;
  flow<T1, T2, T3, T4, T5, T6>(
    op1: Operator<TInput, T1>,
    op2: Operator<T1, T2>,
    op3: Operator<T2, T3>,
    op4: Operator<T3, T4>,
    op5: Operator<T4, T5>,
    op6: Operator<T5, T6>
  ): ChartBuilder<TInput, T6>;
  flow<T1, T2, T3, T4, T5, T6, T7>(
    op1: Operator<TInput, T1>,
    op2: Operator<T1, T2>,
    op3: Operator<T2, T3>,
    op4: Operator<T3, T4>,
    op5: Operator<T4, T5>,
    op6: Operator<T5, T6>,
    op7: Operator<T6, T7>
  ): ChartBuilder<TInput, T7>;
  flow(...ops: Operator<any, any>[]): ChartBuilder<TInput, any> {
    return new ChartBuilder(
      this.data,
      this.options,
      [...this.operators, ...ops],
      this.finalMark,
      this.layerContext,
      this.nodeZOrder
    );
  }

  // facet is an alias for .flow(spread(opts))
  facet(opts: SpreadOptions): ChartBuilder<TInput, any> {
    return this.flow(spread(opts) as any);
  }

  // stack is an alias for .flow(stack(opts))
  // Note: 'stack' below refers to the module-level stack function, not this method
  stack(opts: SpreadOptions): ChartBuilder<TInput, any> {
    return this.flow(stack(opts) as any);
  }

  // mark stores the mark and returns a new builder for chaining
  mark(mark: Mark<TOutput>): ChartBuilder<TInput, TOutput> {
    return new ChartBuilder(
      this.data,
      this.options,
      this.operators,
      mark,
      this.layerContext,
      this.nodeZOrder
    );
  }

  // resolve creates the node; named marks register their nodes into layerContext when invoked
  async resolve(): Promise<GoFishNode> {
    if (!this.finalMark) {
      throw new Error("Cannot resolve: no mark specified. Call .mark() first.");
    }

    // Apply all operators to the mark
    let composedMark = this.finalMark as Mark<any>;
    for (const op of this.operators.toReversed()) {
      composedMark = await op(composedMark);
    }

    // Resolve LayerSelector just before calling mark
    let data = this.data;
    if (data instanceof LayerSelector) {
      data = data.resolve(this.layerContext) as any;
    }

    // Create the node; pass layerContext so named marks can register each produced node
    const node = await Frame(this.options ?? {}, [
      (
        await resolveMarkResult(
          composedMark(data as any, undefined, this.layerContext),
          this.layerContext
        )
      ).setShared([true, true]),
    ]);

    // Embed colorConfig on the node so it survives .resolve() inside Layer
    if (this.options?.color) {
      node.colorConfig = this.options.color;
    }

    if (this.nodeZOrder !== undefined) {
      node.zOrder(this.nodeZOrder);
    }

    return node;
  }

  withLayerContext(layerContext: LayerContext): ChartBuilder<TInput, TOutput> {
    return new ChartBuilder(
      this.data,
      this.options,
      this.operators,
      this.finalMark,
      layerContext,
      this.nodeZOrder
    );
  }

  zOrder(value: number): ChartBuilder<TInput, TOutput> {
    return new ChartBuilder(
      this.data,
      this.options,
      this.operators,
      this.finalMark,
      this.layerContext,
      value
    );
  }

  // render calls resolve and then renders
  async render(
    container: Parameters<GoFishNode["render"]>[0],
    options: Parameters<GoFishNode["render"]>[1]
  ): Promise<ReturnType<GoFishNode["render"]>> {
    const node = await this.resolve();
    return node.render(container, {
      ...options,
      colorConfig: this.options?.color,
    });
  }
}

export function chart<T>(data: T, options?: ChartOptions): ChartBuilder<T, T> {
  return new ChartBuilder<T, T>(data, options, [], undefined, {});
}

export type SpreadOptions<T = any> = {
  by?: keyof T & string;
  dir: "x" | "y";
  spacing?: number;
  alignment?: "start" | "middle" | "end" | "baseline";
  sharedScale?: boolean;
  mode?: "edge" | "center";
  reverse?: boolean;
  w?: number | (keyof T & string);
  h?: number | (keyof T & string);
  debug?: boolean;
};

export const spread = createOperator<any, SpreadOptions>(Spread, {
  split: ({ by }, d) => ({
    entries: by
      ? Map.groupBy(d, (r: any) => r[by])
      : new Map(d.map((r, i) => [i, [r]])),
  }),
  channels: { w: "size", h: "size" },
});

/** Stack has no `spacing` option — children always touch (spacing: 0). */
export type StackOptions<T = any> = Omit<SpreadOptions<T>, "spacing">;

export function stack(
  opts: StackOptions,
  marks: Mark<any>[]
): ReturnType<typeof spread>;
export function stack(opts: StackOptions): Operator<any[], any[]>;
export function stack(opts: StackOptions, marks?: Mark<any>[]): any {
  const stackOpts = { ...opts, spacing: 0 } as SpreadOptions;
  return marks !== undefined
    ? (spread as any)(stackOpts, marks)
    : (spread as any)(stackOpts);
}

export type TableOptions = {
  by?: { x: string; y: string };
  spacing?: number | [number, number];
  numCols?: number; // combinator form only; operator form derives it from colKeys.
};

export const table = createOperator<any, TableOptions, Mark<any>[][]>(Table, {
  split: ({ by }, d) => {
    if (!by?.x || !by?.y)
      throw new Error(
        "table operator form requires opts.by = { x: fieldName, y: fieldName }"
      );
    const colKeys = [...new Map(d.map((r) => [String(r[by.x]), true])).keys()];
    const rowKeys = [...new Map(d.map((r) => [String(r[by.y]), true])).keys()];
    const entries = new Map<string | number, any[]>();
    for (const rowKey of rowKeys)
      for (const colKey of colKeys)
        entries.set(
          `${colKey}-${rowKey}`,
          d.filter(
            (r) => String(r[by.x]) === colKey && String(r[by.y]) === rowKey
          )
        );
    return { entries, keys: { colKeys, rowKeys } };
  },
  enumerateMarks: (grid) => {
    const out = new Map<string | number, Mark<any>>();
    grid.forEach((row, i) => row.forEach((m, j) => out.set(`${i}-${j}`, m)));
    return out;
  },
});

/**
 * Scatter options. Each position field (`x`/`y`/`xMin`/etc.) accepts either:
 *   - a field-name accessor string (operator form; inferred per entry)
 *   - a pre-built positions array (combinator form; used as-is)
 *   - a scalar (applied to all children)
 * Per-entry channel inference handles the polymorphism.
 *
 * `by` is a groupBy field — omit for per-item scatter.
 */
export type ScatterOptions = {
  by?: string;
  x?: string | number | MaybeValue<number>[];
  y?: string | number | MaybeValue<number>[];
  xMin?: string | MaybeValue<number>[];
  xMax?: string | MaybeValue<number>[];
  yMin?: string | MaybeValue<number>[];
  yMax?: string | MaybeValue<number>[];
  alignment?: "start" | "middle" | "end" | "baseline";
  debug?: boolean;
};

export const scatter = createOperator<any, ScatterOptions>(
  // Channels resolve ScatterOptions' string/scalar forms to ScatterProps'
  // MaybeValue<number>[] at runtime, so we cast to bridge the types.
  // See DeriveMarkProps for the proper channel-aware type-derivation pattern.
  Scatter as unknown as LayoutFn<ScatterOptions>,
  {
    split: ({ by }, d) => ({
      entries: by
        ? Map.groupBy(d, (r: any) => r[by])
        : new Map(d.map((r, i) => [i, [r]])),
    }),
    channels: {
      x: { type: "pos", entry: true },
      y: { type: "pos", entry: true },
      xMin: { type: "pos", entry: true },
      xMax: { type: "pos", entry: true },
      yMin: { type: "pos", entry: true },
      yMax: { type: "pos", entry: true },
    },
  }
);

export type GroupOptions = {
  by?: string;
};

export const group = createOperator<any, GroupOptions, any>(
  async (_opts, children) =>
    (await Frame({}, children)) as unknown as GoFishAST,
  {
    split: ({ by }, d) => {
      if (!by) throw new Error("group requires opts.by = fieldName");
      return { entries: Map.groupBy(d, (r: any) => r[by]) };
    },
  }
);

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
