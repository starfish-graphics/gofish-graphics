import { JSX } from "solid-js/jsx-runtime";
import { For, groupBy, Rect, StackX, StackY, v } from "../../lib";
import { GoFishNode } from "../_node";
import _ from "lodash";

export class GF<T> {
  private _data: T[];
  private _render: (d: T[]) => GoFishNode;

  constructor(data: T[], render?: (d: T[]) => GoFishNode) {
    this._data = data;
    this._render = render ?? (() => Rect({ w: 0, h: 0, fill: "transparent" }));
  }

  rect({ w, h, fill, debug }: { w: number; h: number | string; fill: string; debug?: boolean }) {
    return new GF(this._data, (d: T[]) => {
      if (debug) console.log("rect", d);
      return Rect({
        w,
        h: typeof h === "number" ? h : v(_.sumBy(d, h)),
        fill: v(Array.isArray(d) ? d[0][fill as keyof T] : d[fill as keyof T]),
      });
    });
  }
  // stackX(
  //   iteratee?: string | ((item: T[]) => any),
  //   options?: { spacing?: number; sharedScale?: boolean; alignment?: "start" | "end"; debug?: boolean }
  // ) {
  //   return new GF(this._data, (d: T[]) => {
  //     let groups;
  //     if (typeof iteratee === "function") {
  //       groups = iteratee(d).value();
  //     } else if (typeof iteratee === "string") {
  //       groups = groupBy(d, iteratee);
  //     }
  //     if (options?.debug) console.log("stackX groups", groups);
  //     return StackX(
  //       { spacing: options?.spacing, sharedScale: options?.sharedScale, alignment: options?.alignment },
  //       iteratee ? For(groups, this._render) : For(d, this._render)
  //     );
  //   });
  // }
  // stackY(
  //   iteratee?: string | ((item: T[]) => any),
  //   options?: { spacing?: number; sharedScale?: boolean; alignment?: "start" | "end"; debug?: boolean }
  // ) {
  //   return new GF(this._data, (d: T[]) => {
  //     let groups;
  //     if (typeof iteratee === "function") {
  //       groups = iteratee(d).value();
  //     } else if (typeof iteratee === "string") {
  //       groups = groupBy(d, iteratee);
  //     }
  //     if (options?.debug) console.log("stackY groups", groups);
  //     return StackY(
  //       { spacing: options?.spacing, sharedScale: options?.sharedScale, alignment: options?.alignment },
  //       iteratee ? For(groups, this._render) : For(d, this._render)
  //     );
  //   });
  // }
  // // transform(fn: (d: T[]) => T[]) {
  // //   return new _Chart(this._data, (d: T[]) => For(fn(d), this._render));
  // // }
  // render(
  //   container: HTMLElement,
  //   {
  //     w,
  //     h,
  //     transform,
  //     debug = false,
  //     defs,
  //     axes = false,
  //   }: {
  //     w: number;
  //     h: number;
  //     transform?: { x?: number; y?: number };
  //     debug?: boolean;
  //     defs?: JSX.Element[];
  //     axes?: boolean;
  //   }
  // ) {
  //   return this._render(this._data).render(container, { width: w, height: h, transform, debug, defs, axes });
  // }

  // TEST_render() {
  //   return this._render(this._data);
  // }
}

export const gf = <T>(data: T[]) => new GF(data);
