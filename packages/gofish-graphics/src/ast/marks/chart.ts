import { groupBy, ValueIteratee } from "lodash";
import {
  Frame,
  Spread,
  Stack,
  Scatter,
  sumBy,
  v,
  meanBy,
  Connect,
  ref,
} from "../../lib";
import { GoFishNode } from "../_node";
import { For } from "../iterators/for";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { inferSize, inferPos } from "../channels";
import { Rect } from "../shapes/rect";
import { rect as generatedRect } from "../shapes/rect";
import { Mark, Operator } from "../types";

export type { Mark, Operator };
export { generatedRect as rect };

/** Resolves whatever a Mark returns into a GoFishNode. */
async function resolveMarkResult(
  raw: ReturnType<Mark<any>>,
  layerContext?: LayerContext
): Promise<GoFishNode> {
  if (raw instanceof ChartBuilder)
    return raw.withLayerContext(layerContext ?? {}).resolve();
  if (typeof raw === "function")
    return resolveMarkResult(
      (raw as () => ReturnType<Mark<any>>)(),
      layerContext
    );
  return raw as unknown as GoFishNode;
}

/** Attach .name(layerName) to a mark so it registers each produced node when used in a chart. */
function nameableMark<T>(
  base: Mark<T>
): Mark<T> & { name(layerName: string): Mark<T> } {
  const withName = (layerName: string): Mark<T> => {
    return async (d: T, key?: string | number, layerContext?: LayerContext) => {
      const node = await resolveMarkResult(
        base(d, key, layerContext),
        layerContext
      );
      // Set the node name for ref() lookup in low-level context
      node.name(layerName);
      if (layerContext && layerName) {
        if (!layerContext[layerName]) {
          layerContext[layerName] = { data: [], nodes: [] };
        }
        layerContext[layerName].nodes.push(node);
        layerContext[layerName].data.push((node as any).datum);
      }
      return node;
    };
  };
  Object.defineProperty(base, "name", {
    value: withName,
    writable: true,
    configurable: true,
  });
  return base as Mark<T> & { name(layerName: string): Mark<T> };
}

const connectXMode = {
  edge: "edge-to-edge",
  center: "center-to-center",
} as const;

export type LayerContext = {
  [name: string]: {
    data: any[];
    nodes: GoFishNode[];
  };
};

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
};

export class ChartBuilder<TInput, TOutput = TInput> {
  private readonly data: TInput;
  private readonly options?: ChartOptions;
  private readonly operators: Operator<any, any>[] = [];
  private readonly finalMark?: Mark<TOutput>;
  private readonly layerContext: LayerContext;

  constructor(
    data: TInput,
    options?: ChartOptions,
    operators: Operator<any, any>[] = [],
    finalMark?: Mark<TOutput>,
    layerContext: LayerContext = {}
  ) {
    this.data = data;
    this.options = options;
    this.operators = operators;
    this.finalMark = finalMark;
    this.layerContext = layerContext;
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
      this.layerContext
    );
  }

  // facet is an alias for .flow(spread(...))
  facet(
    fieldOrOptions: Parameters<typeof spread>[0],
    options?: Parameters<typeof spread>[1]
  ): ChartBuilder<TInput, any> {
    return this.flow(spread(fieldOrOptions as any, options));
  }

  // stack is an alias for .flow(stack(...))
  // Note: 'stack' below refers to the module-level stack function, not this method
  stack(
    field: Parameters<typeof stack>[0],
    options: Parameters<typeof stack>[1]
  ): ChartBuilder<TInput, any> {
    return this.flow(stack(field as any, options));
  }

  // mark stores the mark and returns a new builder for chaining
  mark(mark: Mark<TOutput>): ChartBuilder<TInput, TOutput> {
    return new ChartBuilder(
      this.data,
      this.options,
      this.operators,
      mark,
      this.layerContext
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

    return node;
  }

  withLayerContext(layerContext: LayerContext): ChartBuilder<TInput, TOutput> {
    return new ChartBuilder(
      this.data,
      this.options,
      this.operators,
      this.finalMark,
      layerContext
    );
  }

  // render calls resolve and then renders
  async render(
    ...args: Parameters<GoFishNode["render"]>
  ): Promise<ReturnType<GoFishNode["render"]>> {
    const node = await this.resolve();
    return node.render(...args);
  }
}

export function chart<T>(data: T, options?: ChartOptions): ChartBuilder<T, T> {
  return new ChartBuilder<T, T>(data, options, [], undefined, {});
}

type SpreadOptions<T> = {
  dir: "x" | "y";
  x?: number;
  y?: number;
  t?: number;
  r?: number;
  w?: number | keyof T;
  h?: number | keyof T;
  mode?: "edge" | "center";
  spacing?: number;
  sharedScale?: boolean;
  alignment?: "start" | "middle" | "end" | "baseline";
  reverse?: boolean;
  debug?: boolean;
  label?: boolean;
};

/** Mark combinator form: spread(opts, marks[]) → NameableMark */
export function spread<T>(
  options: SpreadOptions<T>,
  marks: Mark<any>[]
): Mark<T> & { name(layerName: string): Mark<T> };
/** Operator form: spread(field, opts) → Operator */
export function spread<T>(
  field: keyof T,
  options: SpreadOptions<T>
): Operator<T[], T[]>;
/** Operator form: spread(opts) → Operator */
export function spread<T>(options: SpreadOptions<T>): Operator<T[], T[]>;
export function spread<T>(
  fieldOrOptions: keyof T | SpreadOptions<T>,
  optionsOrMarks?: SpreadOptions<T> | Mark<any>[]
): Operator<T[], T[]> | (Mark<T> & { name(layerName: string): Mark<T> }) {
  // Mark combinator form: spread(opts, marks[])
  if (
    typeof fieldOrOptions === "object" &&
    Array.isArray(optionsOrMarks) &&
    optionsOrMarks.length > 0 &&
    typeof optionsOrMarks[0] === "function"
  ) {
    const opts = fieldOrOptions as SpreadOptions<T>;
    const marks = optionsOrMarks as Mark<any>[];
    const base: Mark<T> = async (
      d: T,
      key?: string | number,
      layerContext?: LayerContext
    ) => {
      const resolvedChildren = await Promise.all(
        marks.map((mark) =>
          resolveMarkResult(mark(d, key, layerContext), layerContext)
        )
      );
      return Spread(
        {
          direction: opts.dir === "x" ? 0 : 1,
          spacing: opts.spacing ?? 0,
          alignment: opts.alignment ?? "baseline",
          sharedScale: opts.sharedScale,
        },
        resolvedChildren
      );
    };
    return nameableMark(base);
  }

  // Operator form
  const field: keyof T | undefined =
    typeof fieldOrOptions === "object" ? undefined : fieldOrOptions;
  const opts = (
    typeof fieldOrOptions === "object"
      ? fieldOrOptions
      : (optionsOrMarks as SpreadOptions<T>)
  )!;

  const finalOptions = {
    ...opts,
    label: opts?.label ?? false,
    alignment: opts?.alignment ?? "baseline",
  };

  return async (mark: Mark<T[]>) => {
    return async (
      d: T[],
      key?: string | number,
      layerContext?: LayerContext
    ) => {
      // Group by the field if provided, otherwise iterate over raw data
      const grouped = field
        ? typeof field === "string"
          ? Map.groupBy(d, (row) => (row as any)[field])
          : Map.groupBy(d, field as any)
        : d;

      return Spread(
        {
          direction: finalOptions.dir === "x" ? 0 : 1,
          x: finalOptions?.x ?? finalOptions?.t,
          y: finalOptions?.y ?? finalOptions?.r,
          mode: finalOptions?.mode
            ? connectXMode[finalOptions?.mode]
            : undefined,
          spacing: finalOptions?.spacing ?? 8,
          sharedScale: finalOptions?.sharedScale,
          alignment: finalOptions?.alignment,
          reverse: finalOptions?.reverse,
          w: finalOptions?.w
            ? inferSize(finalOptions?.w as string | number, d)
            : undefined,
          h: finalOptions?.h
            ? inferSize(finalOptions?.h as string | number, d)
            : undefined,
        },
        For(grouped as any, async (groupData: T[], k) => {
          const currentKey = key != undefined ? `${key}-${k}` : k;
          const node = await resolveMarkResult(
            mark(groupData, currentKey, layerContext),
            layerContext
          );
          // Always set keys for ordinal axis mapping, regardless of label setting
          return node.setKey(currentKey?.toString() ?? "");
        })
      );
    };
  };
}

/** Mark combinator form: stack(opts, marks[]) → NameableMark */
export function stack<T>(
  options: SpreadOptions<T>,
  marks: Mark<any>[]
): Mark<T> & { name(layerName: string): Mark<T> };
/** Operator form: stack(field, opts) → Operator */
export function stack<T>(
  field: keyof T,
  options: SpreadOptions<T>
): Operator<T[], T[]>;
/** Operator form: stack(opts) → Operator */
export function stack<T>(
  fieldOrOptions: keyof T | SpreadOptions<T>,
  optionsOrMarks?: SpreadOptions<T> | Mark<any>[]
): Operator<T[], T[]> | (Mark<T> & { name(layerName: string): Mark<T> }) {
  // Mark combinator form: stack(opts, marks[])
  if (
    typeof fieldOrOptions === "object" &&
    Array.isArray(optionsOrMarks) &&
    optionsOrMarks.length > 0 &&
    typeof optionsOrMarks[0] === "function"
  ) {
    return spread(
      { ...(fieldOrOptions as SpreadOptions<T>), spacing: 0 },
      optionsOrMarks as Mark<any>[]
    );
  }
  if (typeof fieldOrOptions === "object") {
    return spread({ ...fieldOrOptions, spacing: 0 });
  }
  return spread(fieldOrOptions, {
    ...(optionsOrMarks as SpreadOptions<T>),
    spacing: 0,
  });
}

export function scatter<T>(
  fieldOrOptions:
    | keyof T
    | {
        x?: number | (keyof T & string);
        y?: number | (keyof T & string);
        alignment?: "start" | "middle" | "end" | "baseline";
        debug?: boolean;
      },
  options?: {
    x?: number | (keyof T & string);
    y?: number | (keyof T & string);
    alignment?: "start" | "middle" | "end" | "baseline";
    debug?: boolean;
  }
): Operator<T[], T[]> {
  const field: keyof T | undefined =
    typeof fieldOrOptions === "object" ? undefined : fieldOrOptions;
  const opts = (typeof fieldOrOptions === "object" ? fieldOrOptions : options)!;
  if (opts.x === undefined && opts.y === undefined) {
    throw new Error("scatter() requires at least one of x or y");
  }

  return async (mark: Mark<T[]>) => {
    return async (
      d: T[],
      key?: string | number,
      layerContext?: LayerContext
    ) => {
      if (field !== undefined) {
        // Group by field, position each group at its mean x/y
        const groups = groupBy(d, field as ValueIteratee<T>);
        if (opts?.debug) console.log("scatter groups", groups);
        const entries = Object.entries(groups);
        const resolved = await Promise.all(
          entries.map(async ([groupKey, items]) => {
            const x =
              opts.x === undefined ? undefined : inferPos(opts.x, items);
            const y =
              opts.y === undefined ? undefined : inferPos(opts.y, items);
            if (opts?.debug) console.log(`Group ${groupKey}: x=${x}, y=${y}`);
            const currentKey =
              key != undefined ? `${key}-${groupKey}` : groupKey;
            return {
              x,
              y,
              child: (await resolveMarkResult(
                mark(items, currentKey, layerContext),
                layerContext
              )) as any,
            };
          })
        );
        return Scatter(
          {
            x:
              opts.x === undefined
                ? undefined
                : resolved.map((entry) => entry.x!),
            y:
              opts.y === undefined
                ? undefined
                : resolved.map((entry) => entry.y!),
            alignment: opts.alignment,
          },
          resolved.map((entry) => entry.child)
        );
      } else {
        // No grouping — position each item at its own x/y
        if (opts?.debug) console.log("scatter items", d);
        const resolved = await Promise.all(
          d.map(async (item, i) => {
            const x =
              opts.x === undefined ? undefined : inferPos(opts.x, [item]);
            const y =
              opts.y === undefined ? undefined : inferPos(opts.y, [item]);
            if (opts?.debug) console.log(`Item ${i}: x=${x}, y=${y}`);
            const currentKey = key != undefined ? `${key}-${i}` : i;
            return {
              x,
              y,
              child: (await resolveMarkResult(
                mark([item], currentKey as any, layerContext),
                layerContext
              )) as any,
            };
          })
        );
        return Scatter(
          {
            x:
              opts.x === undefined
                ? undefined
                : resolved.map((entry) => entry.x!),
            y:
              opts.y === undefined
                ? undefined
                : resolved.map((entry) => entry.y!),
            alignment: opts.alignment,
          },
          resolved.map((entry) => entry.child)
        );
      }
    };
  };
}

export function group<T>(field: keyof T): Operator<T[], T[]> {
  return async (mark: Mark<T[]>) => {
    return async (
      d: T[],
      key?: string | number,
      layerContext?: LayerContext
    ) => {
      // Group by the field
      const groups = groupBy(d, field as ValueIteratee<T>);

      return Frame(
        {},
        For(groups, (items, groupKey) => {
          // Apply mark to each group
          const currentKey = key != undefined ? `${key}-${groupKey}` : groupKey;
          return mark(items, currentKey, layerContext) as any;
        })
      );
    };
  };
}

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
}): Mark<T> & { name(layerName: string): Mark<T> } {
  const base: Mark<T> = async (
    d: T,
    key?: string | number,
    _layerContext?: LayerContext
  ) => {
    if (debug) console.log("circle", key, d);
    const node = Rect({
      w: typeof r === "number" ? r * 2 : inferSize(r, d),
      h: typeof r === "number" ? r * 2 : inferSize(r, d),
      rx: typeof r === "number" ? r : 5,
      ry: typeof r === "number" ? r : 5,
      fill:
        typeof fill === "string" && fill in d ? v(d[fill as keyof T]) : fill,
      stroke,
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
        mode: "center-to-center",
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
        mode: "edge-to-edge",
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

// scaffold() mark creates invisible guides for positioning
export function scaffold<T extends Record<string, any>>({
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
  // scaffold is essentially a transparent/zero-size rect
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
