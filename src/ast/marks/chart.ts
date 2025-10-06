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
} from "../../lib";
import { GoFishNode } from "../_node";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { MaybeValue } from "../data";

/* inference */
const inferSize = <T>(
  accessor: string | number | undefined,
  d: T[]
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
    filter,
  }: {
    w?: number | string;
    h?: number | string;
    rs?: number;
    ts?: number;
    rx?: number;
    ry?: number;
    fill: string;
    debug?: boolean;
    filter?: string;
  }) {
    return new _Chart(this._data, (d: T[], key: number | string) => {
      if (debug) console.log("rect", key, d);
      return Rect({
        w: inferSize(w, d) ?? inferSize(ts, d),
        h: inferSize(h, d) ?? inferSize(rs, d),
        filter,
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
      mixBlendMode?: "normal" | "multiply";
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
                  mixBlendMode: options?.mixBlendMode,
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
                mixBlendMode: options?.mixBlendMode,
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

export const Chart = <T>(data: T[]) => new _Chart(data);

type ChartRect = {
  w?: number | string;
  h?: number | string;
  ts?: number | string;
  rs?: number | string;
  rx?: number;
  ry?: number;
  fill: string;
  debug?: boolean;
  filter?: string;
};

export const rect = <T>(
  dataOrOptions?: T[] | ChartRect,
  optionsArg?: ChartRect
) => {
  let data: T[];
  let options: ChartRect;

  if (Array.isArray(dataOrOptions)) {
    data = dataOrOptions;
    options = optionsArg!;
  } else {
    data = [];
    options = dataOrOptions as ChartRect;
  }

  return Chart(data).rect(options);
};

export const guide = <T>(
  data: T[],
  {
    w = 0,
    h = 0,
    fill,
    debug,
  }: { w?: number; h?: number | string; fill: string; debug?: boolean }
) => Chart(data).guide({ w, h, fill, debug });
