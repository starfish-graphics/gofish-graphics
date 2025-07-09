import { JSX } from "solid-js/jsx-runtime";
import { ConnectX, For, Frame, groupBy, Rect, Ref, StackX, StackY, v } from "../../lib";
import { GoFishNode } from "../_node";
import _ from "lodash";

export class _Chart<T> {
  private _data: T[];
  private _render: (d: T[], key: number | string) => GoFishNode;

  constructor(data: T[], render?: (d: T[], key: number | string) => GoFishNode) {
    this._data = data;
    this._render = render ?? (() => Rect({ w: 0, h: 0, fill: "transparent" }));
  }

  rect({ w, h, fill, debug }: { w: number; h: number | string; fill: string; debug?: boolean }) {
    return new _Chart(this._data, (d: T[], key: number | string) => {
      if (debug) console.log("rect", key, d);
      return Rect({
        w,
        h: typeof h === "number" ? h : v(_.sumBy(d, h)),
        fill: v(Array.isArray(d) ? d[0][fill as keyof T] : d[fill as keyof T]),
      }).name(key.toString());
    });
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
      if (options?.debug) console.log("connectX", options?.over, groupBy(d, options?.over?.toString() ?? ""));
      return Frame([
        this._render(d, k),
        options?.over
          ? For(groupBy(d, key.toString()), (items, o) =>
              ConnectX(
                { interpolation: options?.interpolation, opacity: options?.opacity },
                For(groupBy(items, options?.over?.toString()), (item, i) => Ref(`${k}-${i}-${o}`))
              )
            )
          : ConnectX(
              { interpolation: options?.interpolation, opacity: options?.opacity },
              For(groupBy(d, key.toString()), (items, i) => Ref(`${k}-${i}`))
            ),
      ]);
    });
  }
  stackX(
    iteratee?: string | ((item: T[]) => any),
    options?: { spacing?: number; sharedScale?: boolean; alignment?: "start" | "end"; debug?: boolean }
  ) {
    return new _Chart(this._data, (d: T[], k: number | string) => {
      let groups;
      if (typeof iteratee === "function") {
        groups = iteratee(d).value();
      } else if (typeof iteratee === "string") {
        groups = groupBy(d, iteratee);
      }
      if (options?.debug) console.log("stackX groups", groups);
      return StackX(
        { spacing: options?.spacing, sharedScale: options?.sharedScale, alignment: options?.alignment },
        iteratee
          ? For(groups, (items, key) => this._render(items, `${k}-${key}`))
          : For(d, (item, key) => this._render(item, `${k}-${key}`))
      );
    });
  }
  stackY(
    iteratee?: string | ((item: T[]) => any),
    options?: { spacing?: number; sharedScale?: boolean; alignment?: "start" | "end"; debug?: boolean }
  ) {
    return new _Chart(this._data, (d: T[], k: number | string) => {
      let groups;
      if (typeof iteratee === "function") {
        groups = iteratee(d).value();
      } else if (typeof iteratee === "string") {
        groups = groupBy(d, iteratee);
      }
      if (options?.debug) console.log("stackY groups", groups);
      return StackY(
        { spacing: options?.spacing, sharedScale: options?.sharedScale, alignment: options?.alignment },
        iteratee
          ? For(groups, (items, key) => this._render(items, `${k}-${key}`))
          : For(d, (item, key) => this._render(item, `${k}-${key}`))
      );
    });
  }
  // transform(fn: (d: T[]) => T[]) {
  //   return new _Chart(this._data, (d: T[]) => For(fn(d), this._render));
  // }
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
    return this._render(this._data, "root").render(container, { w: w, h: h, transform, debug, defs, axes });
  }

  TEST_render(debug?: boolean) {
    if (debug) console.log("TEST_render", this._render(this._data, "root"));
    return this._render(this._data, "root");
  }
}

export const Chart = <T>(data: T[]) => new _Chart(data);

export const rect = <T>(
  data: T[],
  { w, h, fill, debug }: { w: number; h: number | string; fill: string; debug?: boolean }
) => Chart(data).rect({ w, h, fill, debug });
