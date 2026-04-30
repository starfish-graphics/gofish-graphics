/**
 * cut: a flow operator that visually slices a single source shape (image or
 * rect) into per-datum segments along an axis. Each per-group glyph aligns to
 * its own slice of the original artwork rather than to a freshly drawn rect.
 *
 *   chart(data)
 *     .flow(cut({ shape: image({...}), by: "category", dir: "y", size: "amount" }))
 *     .mark(({ slice, ...d }) => layer([slice.name("part"), text({...})]))
 *
 * Cut augments each per-group datum with a synthesized `slice` Mark; when
 * invoked, that Mark renders the corresponding portion of `shape`,
 * mask-clipped to its region. Cut owns arrangement: per-group glyphs are
 * stacked along `dir` with no spacing — gaps come from per-slice `inset`.
 */
import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import { Mark, Operator } from "../types";
import {
  resolveMarkResult,
  nameableMark,
  NameableMark,
} from "../marks/createOperator";
import { Spread } from "./spread";
import { mask as Mask } from "./porterDuff";
import { Rect } from "../shapes/rect";
import { createNodeOperator } from "../withGoFish";
import { sumBy } from "lodash";

export type CutOptions<T = any> = {
  /** The source shape mark (e.g. image(...) or rect(...)). Must have explicit
   *  w and h — cross-axis size cannot be inferred from intrinsic dims in v1. */
  shape: Mark<any>;
  /** Group key. v1 takes the first row per group. */
  by: keyof T & string;
  /** Cut axis. */
  dir: "x" | "y";
  /** Field whose values determine slice proportions. Defaults to equal slices. */
  size?: keyof T & string;
  /** Pixels removed from each slice's source region (split half on each side
   *  along `dir`). Creates a "chunk taken out" effect on every slice. Default 0. */
  inset?: number;
  /** Pixels of chart-space gap between adjacent slices. Independent of `inset`
   *  — `inset` shrinks each slice's source window, `spacing` separates the
   *  rendered slices. Defaults to Spread's default. */
  spacing?: number;
  /** Cross-axis alignment of slices in the stack. Default "middle". */
  alignment?: "start" | "middle" | "end";
  /** Reverse slice order. */
  reverse?: boolean;
};

/**
 * Wraps a single child node and adds a fixed pixel offset along `dir` to its
 * transform.translate. Used to position the source shape so that the desired
 * portion lands under the slice's mask region.
 */
const translateNode = createNodeOperator<
  { dir: 0 | 1; offset: number },
  GoFishAST
>((opts, children) => {
  if (children.length !== 1) {
    throw new Error("translateNode expects exactly one child");
  }
  const { dir, offset } = opts;
  const dx = dir === 0 ? offset : 0;
  const dy = dir === 1 ? offset : 0;
  return new GoFishNode(
    {
      type: "cut-translate",
      shared: [false, false],
      resolveUnderlyingSpace: (childSpaces) => childSpaces[0] ?? [],
      layout: (_shared, size, scaleFactors, layoutChildren, posScales) => {
        const child = layoutChildren[0].layout(size, scaleFactors, posScales);
        child.place("x", 0, "baseline");
        child.place("y", 0, "baseline");
        return {
          intrinsicDims: [
            {
              min: child.dims[0].min ?? 0,
              size: child.dims[0].size ?? 0,
              center: child.dims[0].center ?? 0,
              max: child.dims[0].max ?? 0,
            },
            {
              min: child.dims[1].min ?? 0,
              size: child.dims[1].size ?? 0,
              center: child.dims[1].center ?? 0,
              max: child.dims[1].max ?? 0,
            },
          ],
          transform: { translate: [undefined, undefined] },
        };
      },
      render: ({ transform }, renderedChildren) => {
        const tx = (transform?.translate?.[0] ?? 0) + dx;
        const ty = (transform?.translate?.[1] ?? 0) + dy;
        return (
          <g transform={`translate(${tx}, ${ty})`}>{renderedChildren[0]}</g>
        );
      },
    },
    children
  );
});

/** Build a slice Mark for a single group. Captures the source shape and this
 *  group's (offsetAlongDir, extentAlongDir, crossExtent, inset). */
const buildSlice = (
  source: Mark<any>,
  dirIdx: 0 | 1,
  sourceDimAlong: number,
  offset: number,
  extent: number,
  crossExtent: number,
  inset: number,
  datum: any
): NameableMark<unknown> => {
  const insetExtent = Math.max(0, extent - inset);
  const insetOffset = offset + inset / 2;

  // Image and rect render with an internal scale(1, -1) that flips their
  // y-axis so the source is right-side up in chart-y space. This means
  // source pixel y=p sits at slice-local chart-y = sourceDimAlong - p. To
  // bring source pixels [insetOffset, insetOffset+insetExtent] into slice-
  // local [0, insetExtent] on y, translate by -(sourceDimAlong - insetOffset
  // - insetExtent), not -insetOffset. The x axis has no such flip.
  const translateOffset =
    dirIdx === 1 ? -(sourceDimAlong - insetOffset - insetExtent) : -insetOffset;

  const base: Mark<unknown> = async (_d, _key, layerContext) => {
    const sliceW = dirIdx === 0 ? insetExtent : crossExtent;
    const sliceH = dirIdx === 1 ? insetExtent : crossExtent;

    // White mask shape: defines the visible region in slice-local coords.
    const regionRect = await Rect({
      x: 0,
      y: 0,
      w: sliceW,
      h: sliceH,
      fill: "white",
    });

    // Source shape, translated so the desired portion lands inside the mask.
    const sourceNode = await resolveMarkResult(source(undefined), layerContext);
    const translated = await translateNode(
      { dir: dirIdx, offset: translateOffset },
      [sourceNode]
    );

    const node = (await Mask({}, [regionRect, translated])) as GoFishNode;
    // Stamp the per-group datum onto the slice's node so that .name("...")
    // registers it for select(), and downstream charts using
    // Chart(select(name)).mark(...) see the original row data.
    (node as any).datum = datum;
    return node;
  };
  return nameableMark(base);
};

export function cut<T extends Record<string, any>>(
  opts: CutOptions<T>
): Operator<T[], T & { slice: NameableMark<unknown> }> {
  const operator: Operator<T[], T & { slice: NameableMark<unknown> }> = async (
    mark
  ) => {
    return (async (data: T[], key?: string | number, layerContext?: any) => {
      // 1. Probe source for intrinsic extents on dir + cross axis.
      const probe = await resolveMarkResult(
        opts.shape(undefined as any),
        layerContext
      );
      const dirIdx: 0 | 1 = opts.dir === "x" ? 0 : 1;
      const crossIdx: 0 | 1 = dirIdx === 0 ? 1 : 0;
      const probeArgs: any = (probe as any).args;
      const sourceDimAlong = probeArgs?.dims?.[dirIdx]?.size;
      const sourceDimCross = probeArgs?.dims?.[crossIdx]?.size;
      if (typeof sourceDimAlong !== "number") {
        throw new Error(
          `cut: source shape must have an explicit ${
            opts.dir === "x" ? "w" : "h"
          } (got ${JSON.stringify(sourceDimAlong)})`
        );
      }
      if (typeof sourceDimCross !== "number") {
        throw new Error(
          `cut: source shape must have an explicit ${
            opts.dir === "x" ? "h" : "w"
          } (cross axis); v1 cannot infer it from intrinsic dimensions`
        );
      }

      // 2. Group by `by`. v1 takes the first row per group.
      const groupMap = new Map<unknown, T[]>();
      for (const row of data) {
        const k = (row as any)[opts.by];
        const list = groupMap.get(k);
        if (list) list.push(row);
        else groupMap.set(k, [row]);
      }
      const groups = [...groupMap.entries()];

      // 3. Compute proportions → pixel extents along dir.
      const weights = groups.map(([, rows]) =>
        opts.size ? sumBy(rows, (r: any) => Number(r[opts.size!]) || 0) : 1
      );
      const total = weights.reduce((a, b) => a + b, 0) || 1;
      const extents = weights.map((w) => (w / total) * sourceDimAlong);

      // 4. Walk groups: build slice mark, call user mark with augmented datum.
      let offset = 0;
      const inset = opts.inset ?? 0;
      const nodes = await Promise.all(
        groups.map(async ([gkey, rows], i) => {
          const slice = buildSlice(
            opts.shape,
            dirIdx,
            sourceDimAlong,
            offset,
            extents[i],
            sourceDimCross,
            inset,
            rows[0]
          );
          offset += extents[i];
          const augmented = { ...rows[0], slice } as T & {
            slice: NameableMark<unknown>;
          };
          const childKey =
            key !== undefined ? `${key}-${String(gkey)}` : String(gkey);
          const node = await resolveMarkResult(
            mark(augmented, childKey, layerContext),
            layerContext
          );
          node.setKey(childKey);
          return node;
        })
      );

      // 5. Stack them along dir. Each slice's bbox is its visible (post-inset)
      // extent; chart-space spacing between slices is independent of inset.
      const stacked = (await Spread(
        {
          dir: opts.dir,
          spacing: opts.spacing,
          alignment: opts.alignment ?? "middle",
          reverse: opts.reverse ?? false,
        },
        nodes
      )) as unknown as GoFishNode;
      (stacked as any).datum = data;
      return stacked;
    }) as Mark<T[]>;
  };
  // Tag for axis title inference (mirrors spread's pattern).
  (operator as any).__axisFields =
    opts.dir === "x" ? { x: opts.by } : { y: opts.by };
  return operator;
}
