import { JSX } from "solid-js/jsx-runtime";
import {
  ConnectX,
  For,
  Frame,
  groupBy,
  Position,
  Rect,
  Ref,
  StackX,
  StackY,
  v,
  sumBy,
  meanBy,
  Stack,
} from "../../lib";
import { GoFishNode } from "../_node";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { MaybeValue } from "../data";
import { Dictionary, List, ValueIteratee } from "lodash";
import { CatchData, catchData as seafood } from "../../data/catch";

/* Goal syntax:

chart(seafood,
  spread_by("lake", {dir: "x"}),
  stack_by("species", {dir: "y"}),
  // rect({h: "count", fill: "species"}),
)

spread(
[chart(seafood,
  group_by("lake"),
  spread({dir: "x"}),
  group_by("species"),
  stack({dir: "y"}),
  rect({h: "count", fill: "species"}),
),
chart(seafood,
  group_by("lake"),
  spread({dir: "x"}),
  group_by("species"),
  stack({dir: "y"}),
  rect({h: "count", fill: "species"}),
),
])

chart(seafood, spread_by("lake", {dir: "x"}))
output: new data + 
*/

chart(
  seafood,
  spread_by("lake", { dir: "x" }),
  rect({ h: "count", fill: "species" })
);

export type Operator<T, U> = (_: Mark<U>) => Mark<T>;
export type Mark<T> = (d: T) => GoFishNode;

// export function chart<T>(
//   data: T[],
//   ...operators: ((chart: _Chart<T>) => _Chart<T>)[],
//   foo: number,
// ): _Chart<T> {
//   let c = new _Chart<T>(data);
//   for (const op of operators) {
//     c = op(c);
//   }
//   return c;
// }

// Overloaded pipe type signature for chart with operators in the middle
// See
// https://github.com/pbeshai/tidy/blob/c283cd64dd175c179ffd2608f0dbcf1e016ac5ce/packages/tidy/src/tidy.ts#L4
// https://github.com/microsoft/TypeScript/issues/29904
// We can do fancier things but I'd rather not...
export function chart<T>(data: T, mark: Mark<T>): GoFishNode;
export function chart<T, T1>(
  data: T,
  op1: Operator<T, T1>,
  mark: Mark<T1>
): GoFishNode;
export function chart<T, T1, T2>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  mark: Mark<T2>
): GoFishNode;
export function chart<T, T1, T2, T3>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  mark: Mark<T3>
): GoFishNode;
export function chart<T, T1, T2, T3, T4>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  mark: Mark<T4>
): GoFishNode;
export function chart<T, T1, T2, T3, T4, T5>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  op5: Operator<T4, T5>,
  mark: Mark<T5>
): GoFishNode;
export function chart<T, T1, T2, T3, T4, T5, T6>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  op5: Operator<T4, T5>,
  op6: Operator<T5, T6>,
  mark: Mark<T6>
): GoFishNode;
export function chart<T, T1, T2, T3, T4, T5, T6, T7>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  op5: Operator<T4, T5>,
  op6: Operator<T5, T6>,
  op7: Operator<T6, T7>,
  mark: Mark<T7>
): GoFishNode;
export function chart<T, T1, T2, T3, T4, T5, T6, T7, T8>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  op5: Operator<T4, T5>,
  op6: Operator<T5, T6>,
  op7: Operator<T6, T7>,
  op8: Operator<T7, T8>,
  mark: Mark<T8>
): GoFishNode;
export function chart<T, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  op5: Operator<T4, T5>,
  op6: Operator<T5, T6>,
  op7: Operator<T6, T7>,
  op8: Operator<T7, T8>,
  op9: Operator<T8, T9>,
  mark: Mark<T9>
): GoFishNode;
export function chart<T, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  data: T,
  op1: Operator<T, T1>,
  op2: Operator<T1, T2>,
  op3: Operator<T2, T3>,
  op4: Operator<T3, T4>,
  op5: Operator<T4, T5>,
  op6: Operator<T5, T6>,
  op7: Operator<T6, T7>,
  op8: Operator<T7, T8>,
  op9: Operator<T8, T9>,
  op10: Operator<T9, T10>,
  mark: Mark<T10>
): GoFishNode;
export function chart<T>(
  data: T,
  ...args: [...Operator<any, any>[], Mark<any>]
): GoFishNode {
  const mark = args[args.length - 1] as Mark<any>;
  const operators = args.slice(0, -1) as Operator<any, any>[];
  let elementFn = mark;
  for (const op of operators) {
    elementFn = op(elementFn);
  }
  return elementFn(data);
}

export function compose<T1, T2>(op1: Operator<T1, T2>): Operator<T1, T2>;
export function compose<T1, T2, T3>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>
): Operator<T1, T3>;
export function compose<T1, T2, T3, T4>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>
): Operator<T1, T4>;
export function compose<T1, T2, T3, T4, T5>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>,
  op4: Operator<T4, T5>
): Operator<T1, T5>;
export function compose<T1, T2, T3, T4, T5, T6>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>,
  op4: Operator<T4, T5>,
  op5: Operator<T5, T6>
): Operator<T1, T6>;
export function compose<T1, T2, T3, T4, T5, T6, T7>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>,
  op4: Operator<T4, T5>,
  op5: Operator<T5, T6>,
  op6: Operator<T6, T7>
): Operator<T1, T7>;
export function compose<T1, T2, T3, T4, T5, T6, T7, T8>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>,
  op4: Operator<T4, T5>,
  op5: Operator<T5, T6>,
  op6: Operator<T6, T7>,
  op7: Operator<T7, T8>
): Operator<T1, T8>;
export function compose<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>,
  op4: Operator<T4, T5>,
  op5: Operator<T5, T6>,
  op6: Operator<T6, T7>,
  op7: Operator<T7, T8>,
  op8: Operator<T8, T9>
): Operator<T1, T9>;
export function compose<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  op1: Operator<T1, T2>,
  op2: Operator<T2, T3>,
  op3: Operator<T3, T4>,
  op4: Operator<T4, T5>,
  op5: Operator<T5, T6>,
  op6: Operator<T6, T7>,
  op7: Operator<T7, T8>,
  op8: Operator<T8, T9>,
  op9: Operator<T9, T10>
): Operator<T1, T10>;
export function compose<T>(...operators: Operator<any, any>[]) {
  return (mark: Mark<T>) => {
    for (const op of operators) {
      mark = op(mark);
    }
    return mark;
  };
}

// export type ShapeCont<T> = (d: T | T[], key: number | string) => GoFishNode;
// export type DataCont = <T, U>(collection: List<T> | null | undefined) => List<U> | null | undefined;
// export type OperatorCont<T> = (collection: List<T> | null | undefined, cont: ShapeCont<T>) => GoFishNode;

export function group_by<T>(iteratee: ValueIteratee<T>) {
  return (d: T[]): Record<string, T[]> => {
    return groupBy(d, iteratee);
  };
}

export function derive<T, U>(fn: (d: T) => U): Operator<T, U> {
  return (mark: Mark<U>) => {
    return (d: T) => mark(fn(d));
  };
}

export function createArrayOperator<T>(
  fn: (children: GoFishNode[]) => GoFishNode
): Operator<T[], { item: T; key: number | string }> {
  return (mark: Mark<{ item: T; key: number | string }>) => {
    return (d: T[]) => {
      return fn(For(d, (item, key) => mark({ item, key })));
    };
  };
}

export function rect<T>({
  w,
  h,
  rs,
  ts,
  rx,
  ry,
  fill,
  debug,
}: {
  w?: number | string;
  h?: number | string;
  rs?: number;
  ts?: number;
  rx?: number;
  ry?: number;
  fill: string;
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

export function spread<T>(options: {
  dir: "x" | "y";
  x?: number;
  y?: number;
  t?: number;
  r?: number;
  w?: number | string;
  h?: number | string;
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
  const opts = { ...options, label: options?.label ?? true };
  return (mark: Mark<{ item: T; key: number | string }>) => {
    return (d) => {
      return Stack(
        {
          dir: opts.dir,
          x: opts?.x ?? opts?.t,
          y: opts?.y ?? opts?.r,
          mode: opts?.mode ? connectXMode[opts?.mode] : undefined,
          spacing: opts?.spacing ?? 8,
          sharedScale: opts?.sharedScale,
          alignment: opts?.alignment,
          w: inferSize(opts?.w, d),
          h: inferSize(opts?.h, d),
        },
        For(d, (item, key) => {
          const node = mark({ item, key: `${k}-${key}` });
          return opts.label ? node.setKey(key) : node;
        })
      );
    };
  };
}

export function spread_by<T>(
  iteratee: ValueIteratee<T>,
  options: {
    dir: "x" | "y";
    x?: number;
    y?: number;
    t?: number;
    r?: number;
    w?: number | string;
    h?: number | string;
    mode?: "edge" | "center";
    spacing?: number;
    sharedScale?: boolean;
    alignment?: "start" | "middle" | "end";
    debug?: boolean;
    label?: boolean;
  }
): Operator<T[], { item: T[]; key: number | string }> {
  return compose(derive(group_by(iteratee)), spread(options));
}

/* inference */
const inferSize = <T>(
  accessor: string | number | undefined,
  d: T | T[]
): MaybeValue<number> | undefined => {
  return typeof accessor === "number"
    ? accessor
    : accessor !== undefined
      ? v(sumBy(d, accessor))
      : undefined;
};

const connectXMode = {
  edge: "edge-to-edge",
  center: "center-to-center",
};

export class _Chart<T> {
  private _data: T[];
  private _render: (d: T[], key: number | string) => GoFishNode;

  constructor(
    data: T[],
    render?: (d: T[], key: number | string) => GoFishNode
  ) {
    this._data = data;
    this._render = render ?? (() => Rect({ w: 0, h: 0, fill: "transparent" }));
  }

  transform(fn: (d: T[]) => T[]) {
    return new _Chart(this._data, (d: T[], key: number | string) =>
      this._render(fn(d), key)
    );
  }

  rect({
    w,
    h,
    rs,
    ts,
    rx,
    ry,
    fill,
    debug,
  }: {
    w?: number | string;
    h?: number | string;
    rs?: number;
    ts?: number;
    rx?: number;
    ry?: number;
    fill: string;
    debug?: boolean;
  }) {
    return new _Chart(this._data, (d: T[], key: number | string) => {
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
      }).name(key.toString());
    });
  }
  guide({
    w = 0,
    h = 0,
    fill,
    debug,
  }: {
    w?: number;
    h?: number | string;
    fill: string;
    debug?: boolean;
  }) {
    return this.rect({ w, h, fill, debug });
  }
  /* TODO: I think the for/groupby needs to go outside the connectX and then there's another for
  inside that iterates over all the items.
  
  Then I have to grab the keys in a more clever way.
  */
  connectX(
    key: number | string,
    options?: {
      over?: number | string;
      interpolation?: "linear" | "bezier";
      opacity?: number;
      mode?: "edge" | "center";
      strokeWidth?: number;
      debug?: boolean;
    }
  ) {
    return new _Chart(this._data, (d: T[], k: number | string) => {
      if (options?.debug)
        console.log(
          "connectX",
          k,
          groupBy(d, key?.toString()),
          For(groupBy(d, key?.toString()), (items, i) => `${k}-${i}`)
        );
      if (options?.debug)
        console.log(
          "connectX",
          options?.over,
          groupBy(d, options?.over?.toString() ?? "")
        );
      return Frame([
        this._render(d, k).setShared([true, true]),
        options?.over
          ? For(groupBy(d, key.toString()), (items, o) =>
              ConnectX(
                {
                  interpolation: options?.interpolation,
                  opacity: options?.opacity,
                  mode: options?.mode ? connectXMode[options?.mode] : undefined,
                  strokeWidth: options?.strokeWidth,
                },
                For(groupBy(items, options?.over?.toString()), (item, i) =>
                  Ref(`${k}-${i}-${o}`)
                )
              )
            )
          : ConnectX(
              {
                interpolation: options?.interpolation,
                opacity: options?.opacity,
                mode: options?.mode ? connectXMode[options?.mode] : undefined,
                strokeWidth: options?.strokeWidth,
              },
              For(groupBy(d, key.toString()), (items, i) => Ref(`${k}-${i}`))
            ),
      ]);
    });
  }
  spreadX(
    iteratee?: string | ((item: T[]) => any),
    options?: {
      x?: number;
      y?: number;
      t?: number;
      r?: number;
      w?: number | string;
      h?: number | string;
      mode?: "edge" | "center";
      spacing?: number;
      sharedScale?: boolean;
      alignment?: "start" | "middle" | "end";
      debug?: boolean;
      label?: boolean;
    } = {}
  ) {
    // Default label to true if not specified
    const opts = { ...options, label: options?.label ?? true };
    return new _Chart(this._data, (d: T[], k: number | string) => {
      let groups;
      if (typeof iteratee === "function") {
        groups = iteratee(d).value();
      } else if (typeof iteratee === "string") {
        groups = groupBy(d, iteratee);
      }
      if (opts?.debug) console.log("stackX groups", groups);
      return StackX(
        {
          x: opts?.x ?? opts?.t,
          y: opts?.y ?? opts?.r,
          mode: opts?.mode ? connectXMode[opts?.mode] : undefined,
          spacing: opts?.spacing ?? 8,
          sharedScale: opts?.sharedScale,
          alignment: opts?.alignment,
          w: inferSize(opts?.w, d),
          h: inferSize(opts?.h, d),
        },
        iteratee
          ? For(groups, (items, key) => {
              const node = this._render(items, `${k}-${key}`);
              return opts.label ? node.setKey(key) : node;
            })
          : For(d, (item, key) => {
              const node = this._render(item, `${k}-${key}`);
              return opts.label ? node.setKey(key) : node;
            })
      );
    });
  }
  spreadY(
    iteratee?: string | ((item: T[]) => any),
    options?: {
      x?: number;
      y?: number;
      t?: number;
      r?: number;
      w?: number | string;
      h?: number | string;
      mode?: "edge" | "center";
      spacing?: number;
      sharedScale?: boolean;
      alignment?: "start" | "middle" | "end";
      debug?: boolean;
      label?: boolean;
      reverse?: boolean;
    } = {}
  ) {
    // Default label to true if not specified
    const opts = { ...options, label: options?.label ?? true };
    return new _Chart(this._data, (d: T[], k: number | string) => {
      let groups;
      if (typeof iteratee === "function") {
        groups = iteratee(d).value();
      } else if (typeof iteratee === "string") {
        groups = groupBy(d, iteratee);
      }
      if (opts?.debug) console.log("stackY groups", groups);
      return StackY(
        {
          x: opts?.x ?? opts?.t,
          y: opts?.y ?? opts?.r,
          mode: opts?.mode ? connectXMode[opts?.mode] : undefined,
          spacing: opts?.spacing ?? 8,
          sharedScale: opts?.sharedScale,
          alignment: opts?.alignment,
          reverse: opts?.reverse,
          w: inferSize(opts?.w, d),
          h: inferSize(opts?.h, d),
        },
        iteratee
          ? For(groups, (items, key) => {
              const node = this._render(items, `${k}-${key}`);
              return opts.label ? node.setKey(key) : node;
            })
          : For(d, (item, key) => {
              const node = this._render(item, `${k}-${key}`);
              return opts.label ? node.setKey(key) : node;
            })
      );
    });
  }
  stackX(
    iteratee?: string | ((item: T[]) => any),
    options?: {
      sharedScale?: boolean;
      w?: number | string;
      h?: number | string;
      alignment?: "start" | "middle" | "end";
      debug?: boolean;
      spacing?: number;
      label?: boolean;
      reverse?: boolean;
    }
  ) {
    return this.spreadX(iteratee, {
      ...options,
      spacing: options?.spacing ?? 0,
      label: options?.label ?? false,
      reverse: options?.reverse ?? false,
    });
  }
  stackY(
    iteratee?: string | ((item: T[]) => any),
    options?: {
      sharedScale?: boolean;
      w?: number | string;
      h?: number | string;
      alignment?: "start" | "middle" | "end";
      debug?: boolean;
      spacing?: number;
      label?: boolean;
      reverse?: boolean;
    }
  ) {
    return this.spreadY(iteratee, {
      ...options,
      spacing: options?.spacing ?? 0,
      label: options?.label ?? false,
      reverse: options?.reverse ?? false,
    });
  }
  /* theta, r aliases */
  stackT = this.stackX;
  stackR = this.stackY;
  spreadT = this.spreadX;
  spreadR = this.spreadY;
  connectT = this.connectX;
  // connectR = this.connectY;
  /* end aliases */
  // TODO: fix!!!
  scatterXY(
    groupKey: string,
    options: {
      x: (d: T, i: number | string) => number;
      y: (d: T, i: number | string) => number;
    }
  ) {
    return new _Chart(this._data, (d: T[], k: number | string) => {
      const groups = groupBy(d, groupKey);
      return Frame(
        For(groups, (items, key) =>
          For(items, (item, i) =>
            Rect({
              ...this._render([item], `${k}-${key}-${i}`),
              x: options.x(item, i),
              y: options.y(item, i),
            }).name(`${k}-${key}-${i}`)
          )
        )
      );
    });
  }
  scatter(
    key: string,
    options: {
      x: string;
      y: string;
      debug?: boolean;
    }
  ) {
    return new _Chart(this._data, (d: T[], k: number | string) => {
      const groups = groupBy(d, key);
      if (options?.debug) console.log("scatter groups", groups);

      return Frame(
        For(groups, (items, groupKey) => {
          // Calculate average x and y values for this group
          const avgX = meanBy(items, options.x);
          const avgY = meanBy(items, options.y);

          if (options?.debug)
            console.log(`Group ${groupKey}: avgX=${avgX}, avgY=${avgY}`);

          // Render the group items and wrap in Position operator
          return Position({ x: v(avgX), y: v(avgY) }, [
            this._render(items, `${k}-${groupKey}`),
          ]);
        })
      );
    });
  }

  coord(coord: CoordinateTransform) {
    return new _Chart(this._data, (d: T[], k: number | string) => {
      return Frame({ coord }, [this._render(d, k).setShared([true, true])]);
    });
  }

  render(
    container: HTMLElement,
    {
      w,
      h,
      transform,
      debug = false,
      defs,
      axes = false,
    }: {
      w: number;
      h: number;
      transform?: { x?: number; y?: number };
      debug?: boolean;
      defs?: JSX.Element[];
      axes?: boolean;
    }
  ) {
    return this._render(this._data, "root")
      .setShared([true, true])
      .render(container, {
        w: w,
        h: h,
        transform,
        debug,
        defs,
        axes,
      });
  }

  TEST_render(debug?: boolean) {
    if (debug) console.log("TEST_render", this._render(this._data, "root"));
    return this._render(this._data, "root").setShared([true, true]);
  }
}
