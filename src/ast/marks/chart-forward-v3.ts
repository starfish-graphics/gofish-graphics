import { Dictionary, groupBy, ValueIteratee } from "lodash";
import { Frame, Rect, Stack, sumBy, v } from "../../lib";
import { GoFishNode } from "../_node";
import { MaybeValue } from "../data";
import { For } from "../iterators/for";
import { CoordinateTransform } from "../coordinateTransforms/coord";

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

/* Data Transformation Operators */
export function derive<T, U>(fn: (d: T) => U): Operator<T, U> {
  return (mark: Mark<U>) => {
    return (d: T, key?: string | number) => mark(fn(d), key);
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
  return (mark: Mark<T>) => {
    return (d: T, key?: string | number) => {
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
  mark(mark: Mark<TOutput>): GoFishNode {
    let finalMark = mark as Mark<any>;
    const operators = this.operators;

    for (const op of operators.toReversed()) {
      finalMark = op(finalMark);
    }

    return Frame(this.options ?? {}, [
      finalMark(this.data as any).setShared([true, true]),
    ]);
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

  return (mark: Mark<T[]>) => {
    return (d: T[], key?: string | number) => {
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
        For(grouped, (groupData, k) => {
          const currentKey = key != undefined ? `${key}-${k}` : k;
          const node = mark(groupData, currentKey);
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
    w?: number;
    h?: number;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
  }
): Operator<T[], T[]> {
  return spread(field, { ...options, spacing: 0 });
}

export function scatter<T>(options: {
  x?: keyof T;
  y?: keyof T;
  alignment?: "start" | "middle" | "end";
}): Operator<T[], T> {
  // TODO: Implement proper scatter positioning
  throw new Error("scatter not yet implemented");
}

export function foreach<T>(field: keyof T): Operator<T[], T> {
  // TODO: Implement foreach
  throw new Error("foreach not yet implemented");
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
    const data = Array.isArray(d) ? d : [d];
    const firstItem = data[0];
    return Rect({
      emX,
      emY,
      w: w
        ? (inferSize(w as string | number, data) ??
          (ts ? inferSize(ts, data) : undefined))
        : undefined,
      h: h
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
  };
}

export function circle<T extends Record<string, any>>({
  r,
  fill,
  debug,
}: {
  r?: number;
  fill?: string | keyof T;
  debug?: boolean;
}): Mark<T> {
  return (d: T, key?: string | number) => {
    if (debug) console.log("circle", key, d);
    return Rect({
      w: typeof r === "number" ? r * 2 : inferSize(r, d),
      h: typeof r === "number" ? r * 2 : inferSize(r, d),
      rx: typeof r === "number" ? r : 5,
      ry: typeof r === "number" ? r : 5,
      fill:
        typeof fill === "string" && fill in d
          ? v(d[fill as keyof T])
          : (fill ?? "blue"),
    }).name(key?.toString() ?? "");
  };
}
