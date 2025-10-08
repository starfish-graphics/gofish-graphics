import { Dictionary, groupBy, ValueIteratee } from "lodash";
import { Rect, Stack, sumBy, v } from "../../lib";
import { GoFishNode } from "../_node";
import { MaybeValue } from "../data";
import { For } from "../iterators/for";

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

export type Mark<T> = (d: T, key?: string | number) => GoFishNode;

export type Operator<T, U> = (_: Mark<U>) => Mark<T>;

export function derive<T, U>(fn: (d: T) => U): Operator<T, U> {
  return (mark: Mark<U>) => {
    return (d: T, key?: string | number) => mark(fn(d), key);
  };
}

export function createArrayOperator<T>(
  fn: (children: GoFishNode[]) => GoFishNode
): Operator<T[], { item: T; key: number | string }> {
  return (mark: Mark<{ item: T; key: number | string }>) => {
    return (d: T[], key?: string | number) => {
      return fn(
        For(d, (item, k) =>
          mark({ item, key: key != undefined ? `${key}-${k}` : k })
        )
      );
    };
  };
}

export type ChartOperator<T = unknown> = (
  state: ChartState<T>
) => ChartState<T>;

export type ChartDirection = "x" | "y";

export interface ChartState<T = unknown> {
  data: T;
  marks: Array<{ type: string; options?: unknown }>;
}

export class ChartBuilder<T> {
  private readonly data: T;

  constructor(data: T) {
    this.data = data;
  }

  // Overload for better type inference with specific operators
  flow<TFinal>(op1: Operator<T, TFinal>, mark: Mark<TFinal>): GoFishNode;
  flow<T1, TFinal>(
    op1: Operator<T, T1>,
    op2: Operator<T1, TFinal>,
    mark: Mark<TFinal>
  ): GoFishNode;
  flow<T1, T2, TFinal>(
    op1: Operator<T, T1>,
    op2: Operator<T1, T2>,
    op3: Operator<T2, TFinal>,
    mark: Mark<TFinal>
  ): GoFishNode;
  flow<TFinal>(
    ...args: [Operator<T, any>, ...Operator<any, any>[], Mark<TFinal>]
  ): GoFishNode {
    if (args.length === 0) {
      throw new Error("flow requires at least one argument (a mark)");
    }

    let mark = args[args.length - 1] as Mark<TFinal>;
    const operators = args.slice(0, -1) as Operator<any, any>[];

    for (const op of operators.toReversed()) {
      mark = op(mark);
    }

    return mark(this.data as any);
  }
}

export class ChartInstance<T> {
  constructor(public readonly state: ChartState<T>) {}
}

export function chart<T>(data: T): ChartBuilder<T> {
  return new ChartBuilder<T>(data);
}

export function spread<T>(options: {
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
}): Operator<
  T[] | Record<string, T> | _.Collection<T> | _.Object<Dictionary<T>>,
  { item: T; key: number | string }
> {
  // Default label to true if not specified
  const opts = {
    ...options,
    label: options?.label ?? true,
    alignment: options?.alignment ?? "start",
  };
  return (mark: Mark<{ item: T; key: number | string }>) => {
    return (
      d: T[] | Record<string, T> | _.Collection<T> | _.Object<Dictionary<T>>,
      key?: string | number
    ) => {
      return Stack(
        {
          direction: opts.dir === "x" ? 0 : 1,
          x: opts?.x ?? opts?.t,
          y: opts?.y ?? opts?.r,
          mode: opts?.mode ? connectXMode[opts?.mode] : undefined,
          spacing: opts?.spacing ?? 8,
          sharedScale: opts?.sharedScale,
          alignment: opts?.alignment,
          w: inferSize(opts?.w, Array.isArray(d) ? d : Object.values(d)),
          h: inferSize(opts?.h, Array.isArray(d) ? d : Object.values(d)),
        },
        For(d, (item, k) => {
          const currentKey = key != undefined ? `${key}-${k}` : k;
          const node = mark({
            item,
            key: currentKey,
          });
          return opts.label ? node.setKey(currentKey?.toString() ?? "") : node;
        })
      );
    };
  };
}

export function compose<T>(...operators: Operator<any, any>[]) {
  return (mark: Mark<T>) => {
    for (const op of operators.toReversed()) {
      mark = op(mark);
    }
    return mark;
  };
}

export function group_by<T>(iteratee: ValueIteratee<T>) {
  return (d: T[]): Record<string, T[]> => {
    return groupBy(d, iteratee);
  };
}

export function spread_by<T>(
  iteratee: keyof T | ((item: T) => any),
  options: {
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
  return (mark: Mark<{ item: T; key: number | string }>) => {
    return (d: T[], key?: string | number) => {
      // First group the entire array
      const grouped = groupBy(d, iteratee as ValueIteratee<T>);

      // Then spread the grouped results
      return spread(options)(mark)(grouped, key);
    };
  };
}

export function rect<T extends Record<string, any>>({
  w,
  h,
  rs,
  ts,
  rx,
  ry,
  fill,
  debug,
}: {
  w?: number | keyof T;
  h?: number | keyof T;
  rs?: number;
  ts?: number;
  rx?: number;
  ry?: number;
  fill: keyof T | (string & {});
  debug?: boolean;
}): Mark<T | T[] | { item: T | T[]; key: number | string }> {
  return (input: T | T[] | { item: T | T[]; key: number | string }) => {
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
    return Rect({
      w: inferSize(w, d) ?? inferSize(ts, d),
      h: inferSize(h, d) ?? inferSize(rs, d),
      // rs: inferSize(rs, d),
      // ts: inferSize(ts, d),
      rx,
      ry,
      fill:
        typeof fill === "string" &&
        (Array.isArray(d) ? d[0] : d) &&
        fill in (Array.isArray(d) ? d[0] : d)
          ? v(Array.isArray(d) ? d[0][fill as keyof T] : d[fill as keyof T])
          : fill,
    }).name(key?.toString() ?? "");
  };
}

// Minimal dataset stub used by the example
const seafood = [{ lake: "lake1", species: "species1", count: 1 }];
export const chartForwardBar = chart(seafood).flow(
  spread_by("lake", { dir: "x" }),
  rect({ h: "count", fill: "species" })
);
