import { Dictionary, groupBy, ValueIteratee } from "lodash";
import {
  Frame,
  Rect,
  Stack,
  sumBy,
  v,
  Position,
  meanBy,
  getLayerContext,
  Connect,
  Ref,
  gofish,
} from "../../lib";
import { GoFishNode } from "../_node";
import { MaybeValue } from "../data";
import { For } from "../iterators/for";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { createResource } from "solid-js";

/* inference */
const inferSize = <T>(
  accessor: string | number | undefined,
  d: T | T[]
): MaybeValue<number> | undefined => {
  return typeof accessor === "number"
    ? accessor
    : accessor !== undefined
      ? v(sumBy(d as T[], accessor))
      : undefined;
};

const connectXMode = {
  edge: "edge-to-edge",
  center: "center-to-center",
} as const;

export type Mark<T> = (d: T, key?: string | number) => Promise<GoFishNode>;

export type Operator<T, U> = (_: Mark<U>) => Promise<Mark<T>>;

// LayerSelector is a lazy selector that defers layer lookup until actually needed
export class LayerSelector<T = any> {
  constructor(public readonly layerName: string) {}
  
  // Resolve the selector to actual data - throws if layer not found
  resolve(): Array<T & { __ref: GoFishNode }> {
    const layerContext = getLayerContext();
    const layer = layerContext[this.layerName];

    if (!layer) {
      throw new Error(
        `Layer "${this.layerName}" not found. Make sure to call .as("${this.layerName}") first.`
      );
    }

    // Return node-attached data enriched with refs to nodes
    return layer.nodes.map((node: GoFishNode) => {
      const datum: any = (node as any).datum;
      if (datum && typeof datum === "object") {
        // (datum as any).__ref = node;
        const datumHack = { ...datum[0], __ref: node };
        return datumHack as T & { __ref: GoFishNode };
      }
      return { item: datum, __ref: node } as unknown as T & { __ref: GoFishNode };
    });
  }
}

/* Data Transformation Operators */
export function derive<T, U>(fn: (d: T) => U | Promise<U>): Operator<T, U> {
  return async (mark: Mark<U>) => {
    return async (d: T, key?: string | number) => {
      return mark(await fn(d), key);
    };
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
    return async (d: T, key?: string | number) => {
      if (label) {
        console.log(label, d);
      } else {
        console.log(d);
      }
      return mark(d, key);
    };
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

  constructor(
    data: TInput,
    options?: ChartOptions,
    operators: Operator<any, any>[] = []
  ) {
    this.data = data;
    this.options = options;
    this.operators = operators;
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
    return new ChartBuilder(this.data, this.options, [
      ...this.operators,
      ...ops,
    ]);
  }

  // mark applies all accumulated operators and the final mark
  mark(mark: Mark<TOutput>): Promise<
    GoFishNode & { as: (name: string) => GoFishNode }
  > & {
    render: (
      ...args: Parameters<GoFishNode["render"]>
    ) => Promise<ReturnType<GoFishNode["render"]>>;
    as: (name: string) => Promise<GoFishNode>;
  } {
    const nodePromise = (async () => {
      let finalMark = mark as Mark<any>;
      const operators = this.operators;
      let data = this.data;

      // Resolve LayerSelector if data is a lazy selector
      // This defers layer lookup until the mark() phase when layers should be registered
      if (data instanceof LayerSelector) {
        data = data.resolve() as any;
      }

      for (const op of operators.toReversed()) {
        finalMark = await op(finalMark);
      }

      const node = await Frame(this.options ?? {}, [
        (await finalMark(data as any)).setShared([true, true]),
      ]);

      // Add .as() method to the returned node
      (node as any).as = (name: string) => {
        const layerContext = getLayerContext();
        // Use the actual child node from the Frame, not a new tree
        const rootNode = node.children[0] as GoFishNode;

        // Collect only leaf nodes (nodes with no children)
        const collectLeafNodes = (n: GoFishNode): GoFishNode[] => {
          if (n.children && n.children.length > 0) {
            const leaves: GoFishNode[] = [];
            for (const child of n.children) {
              leaves.push(...collectLeafNodes(child as GoFishNode));
            }
            return leaves;
          }
          return [n];
        };

        const leafNodes = collectLeafNodes(rootNode);

        // Store layer data taken from node-attached datum and leaf nodes
        layerContext[name] = {
          data: leafNodes.map((n) => (n as any).datum),
          nodes: leafNodes,
        };

        return node;
      };

      return node as GoFishNode & { as: (name: string) => GoFishNode };
    })();

    const decoratedPromise = nodePromise as typeof nodePromise & {
      render: (...args: Parameters<GoFishNode["render"]>) => HTMLElement;
      as: (name: string) => Promise<GoFishNode>;
    };

    decoratedPromise.render = (container, ...args) =>
      gofish(container, ...args, nodePromise);

    decoratedPromise.as = async (name: string) => {
      const node = await nodePromise;
      return node.as(name);
    };

    return decoratedPromise;
  }
}

export function chart<T>(data: T, options?: ChartOptions): ChartBuilder<T, T> {
  return new ChartBuilder<T, T>(data, options);
}

export function spread<T>(
  fieldOrOptions:
    | keyof T
    | {
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
        alignment?: "start" | "middle" | "end";
        debug?: boolean;
        label?: boolean;
      },
  options?: {
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
    alignment?: "start" | "middle" | "end";
    debug?: boolean;
    label?: boolean;
  }
): Operator<T[], T[]> {
  // Determine if first argument is field or options
  const field: keyof T | undefined =
    typeof fieldOrOptions === "object" ? undefined : fieldOrOptions;
  const opts = (typeof fieldOrOptions === "object" ? fieldOrOptions : options)!;

  const finalOptions = {
    ...opts,
    label: opts?.label ?? true,
    alignment: opts?.alignment ?? "start",
  };

  return async (mark: Mark<T[]>) => {
    return async (d: T[], key?: string | number) => {
      // Group by the field if provided, otherwise iterate over raw data
      const grouped = field ? groupBy(d, field as ValueIteratee<T>) : d;

      return Stack(
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
          w: finalOptions?.w
            ? inferSize(finalOptions?.w as string | number, d)
            : undefined,
          h: finalOptions?.h
            ? inferSize(finalOptions?.h as string | number, d)
            : undefined,
        },
        For(grouped as any, async (groupData: T[], k) => {
          const currentKey = key != undefined ? `${key}-${k}` : k;
          const node = await mark(groupData, currentKey);
          return finalOptions.label
            ? node.setKey(currentKey?.toString() ?? "")
            : node;
        })
      );
    };
  };
}

export function stack<T>(
  field: keyof T,
  options: {
    dir: "x" | "y";
    x?: number;
    y?: number;
    w?: number | keyof T;
    h?: number | keyof T;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
  }
): Operator<T[], T[]> {
  return spread(field, { ...options, spacing: 0 });
}

export function scatter<T>(
  field: keyof T,
  options: {
    x: keyof T;
    y: keyof T;
    debug?: boolean;
  }
): Operator<T[], T[]> {
  return async (mark: Mark<T[]>) => {
    return async (d: T[], key?: string | number) => {
      // Group by the field
      const groups = groupBy(d, field as ValueIteratee<T>);
      if (options?.debug) console.log("scatter groups", groups);

      return Frame(
        For(groups, async (items, groupKey) => {
          // Calculate average x and y values for this group
          const avgX = meanBy(items, options.x as string);
          const avgY = meanBy(items, options.y as string);

          if (options?.debug)
            console.log(`Group ${groupKey}: avgX=${avgX}, avgY=${avgY}`);

          // Render the group items and wrap in Position operator
          const currentKey = key != undefined ? `${key}-${groupKey}` : groupKey;
          return Position({ x: v(avgX), y: v(avgY) }, [
            mark(items, currentKey),
          ]);
        })
      );
    };
  };
}

export function group<T>(field: keyof T): Operator<T[], T[]> {
  return async (mark: Mark<T[]>) => {
    return async (d: T[], key?: string | number) => {
      // Group by the field
      const groups = groupBy(d, field as ValueIteratee<T>);

      return Frame(
        {},
        For(groups, (items, groupKey) => {
          // Apply mark to each group
          const currentKey = key != undefined ? `${key}-${groupKey}` : groupKey;
          return mark(items, currentKey);
        })
      );
    };
  };
}

export function rect<T extends Record<string, any>>({
  emX,
  emY,
  w,
  h,
  rs,
  ts,
  rx,
  ry,
  fill,
  debug,
  stroke,
  strokeWidth,
}: {
  emX?: boolean;
  emY?: boolean;
  w?: number | keyof T;
  h?: number | keyof T;
  rs?: number;
  ts?: number;
  rx?: number;
  ry?: number;
  fill?: keyof T | string;
  stroke?: string;
  strokeWidth?: number;
  debug?: boolean;
}): Mark<T | T[] | { item: T | T[]; key: number | string }> {
  return async (input: T | T[] | { item: T | T[]; key: number | string }) => {
    let d: T | T[], key: number | string | undefined;
    if (typeof input === "object" && input !== null && "item" in input) {
      // @ts-ignore
      d = input.item;
      // @ts-ignore
      key = input.key;
    } else {
      d = input;
      key = undefined;
    }
    if (debug) console.log("rect", key, d);
    const data = Array.isArray(d) ? d : [d];
    const firstItem = data[0];
    const node = Rect({
      emX,
      emY,
      w:
        w !== undefined
          ? (inferSize(w as string | number, data) ??
            (ts ? inferSize(ts, data) : undefined))
          : undefined,
      h:
        h !== undefined
          ? (inferSize(h as string | number, data) ??
            (rs ? inferSize(rs, data) : undefined))
          : undefined,
      rx,
      ry,
      fill:
        typeof fill === "string" && data.length > 0 && fill in firstItem
          ? v(firstItem[fill as keyof T])
          : fill,
      stroke,
      strokeWidth,
    }).name(key?.toString() ?? "");
    (node as any).datum = d;
    return node;
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
}): Mark<T> {
  return async (d: T, key?: string | number) => {
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
}

// select() returns a lazy selector that defers layer lookup until actually needed
// This allows layers to be registered by .as() calls before select() tries to access them
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
    key?: string | number
  ) => {
    // Use refs from enriched data if available
    const refs = d.map((item) => {
      if ("__ref" in item && item.__ref) {
        return Ref(item.__ref);
      }
      // Fallback to name-based ref if no __ref
      return Ref(`${key}`);
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
    key?: string | number
  ) => {
    // Use refs from enriched data if available
    const refs = d.map((item) => {
      if ("__ref" in item && item.__ref) {
        return Ref(item.__ref);
      }
      // Fallback to name-based ref if no __ref
      return Ref(`${key}`);
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
  rs,
  ts,
  rx,
  ry,
  fill,
  debug,
  stroke,
  strokeWidth,
}: {
  emX?: boolean;
  emY?: boolean;
  w?: number | keyof T;
  h?: number | keyof T;
  rs?: number;
  ts?: number;
  rx?: number;
  ry?: number;
  fill?: keyof T | string;
  stroke?: string;
  strokeWidth?: number;
  debug?: boolean;
} = {}): Mark<T | T[] | { item: T | T[]; key: number | string }> {
  // scaffold is essentially a transparent/zero-size rect
  return rect({
    emX,
    emY,
    w,
    h,
    rs,
    ts,
    rx,
    ry,
    fill,
    debug,
    stroke,
    strokeWidth,
  });
}
