/**
 * createOperator: a factory for v3 layout operators.
 *
 * Every layout operator (spread, stack, scatter, table, group) has the same
 * underlying shape: split the data into pieces, apply a mark to each piece,
 * hand the resulting children to a low-level layout function. This factory
 * captures that shape once so each operator is a short config:
 *
 *   split    : (opts, data) -> [ (key, subdata), ... ] + optional meta
 *   layout   : the low-level node builder (e.g. Spread, Scatter, Frame, Table)
 *   channels?: { w: "size" } — auto-apply inferSize/inferPos/inferColor
 *
 * High-level opts are passed to `layout` directly (after channels apply and
 * meta merges). This requires high-level `OperatorOptions` to match the
 * low-level layout function's opts shape — naming and types should align
 * between the two. v3-only keys (`by`, `debug`) are stripped before layout.
 *
 * The returned function has two call shapes, disambiguated by whether a
 * marks-shape is passed as the second argument:
 *
 *   operator form (inside .flow()):   createOp(opts)                -> Operator
 *   combinator form (inside a mark):  createOp(opts, marksShape)    -> Mark
 *
 * See docs/createOperator.md for a full walk-through, and
 * notes/operator-typeclass.md for the categorical derivation.
 */

import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import { Mark, Operator } from "../types";
import { ChartBuilder } from "./chartBuilder";
import { inferSize, inferPos, inferColor } from "../channels";
import type { MaybeValue, Value } from "../data";
import type { LabelAccessor, LabelOptions } from "../labels/labelPlacement";

/** Per-chart registry of named layers for select() lookup. */
export type LayerContext = {
  [name: string]: {
    data: any[];
    nodes: GoFishNode[];
  };
};

/** A mark that supports .name(layerName) and .label(accessor, options?). */
export type NameableMark<T> = Mark<T> & {
  name(layerName: string): Mark<T>;
  label(accessor: LabelAccessor, options?: LabelOptions): Mark<T>;
};

/** Resolves whatever a Mark returns into a GoFishNode. */
export async function resolveMarkResult(
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

/** Attach .name(layerName) and .label(accessor, options?) to a mark. */
export function nameableMark<T>(base: Mark<T>): NameableMark<T> {
  const withName = (layerName: string): Mark<T> => {
    return async (d: T, key?: string | number, layerContext?: LayerContext) => {
      const node = await resolveMarkResult(
        base(d, key, layerContext),
        layerContext
      );
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
  const withLabel = (
    accessor: LabelAccessor,
    options?: LabelOptions
  ): Mark<T> => {
    return async (d: T, key?: string | number, layerContext?: LayerContext) => {
      const node = await resolveMarkResult(
        base(d, key, layerContext),
        layerContext
      );
      node.label(accessor, options);
      return node;
    };
  };
  Object.defineProperty(base, "name", {
    value: withName,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(base, "label", {
    value: withLabel,
    writable: true,
    configurable: true,
  });
  return base as NameableMark<T>;
}

/**
 * What a split returns. Insertion order is preserved (ES Map spec), which
 * matters for layout ordering.
 *
 * The common case is a bare `Map<key, subdata>`. If the operator also needs
 * to feed axis labels (e.g. `{colKeys, rowKeys}` for table) into the layout
 * function's opts, return the wrapped `{entries, keys}` form instead.
 */
export type SplitResult<Datum> =
  | Map<string | number, Datum[]>
  | {
      entries: Map<string | number, Datum[]>;
      keys?: Record<string, string[]>;
    };

/** Data-encoded opts (same shape as createMark's channel annotations). */
export type ChannelType = "size" | "pos" | "color";

/**
 * Channel spec. String form is the default (aggregate over all data, produces
 * one value). Object form adds flags — notably `entry: true`, which runs the
 * inference once per split entry (using each entry's items) and collects the
 * results into an array. Entry-flagged channels are only meaningful in the
 * operator (traversal) form; in the combinator form they act as the aggregate
 * form for whatever data the combinator was called with.
 */
export type ChannelSpec = ChannelType | { type: ChannelType; entry?: boolean };

export type ChannelAnnotations<Options> = Partial<
  Record<keyof Options, ChannelSpec>
>;

/**
 * The user-facing input type for a single channel-annotated opt, given its
 * ChannelSpec and the datum type. Mirrors DeriveMarkProps from channels.ts
 * but also handles the `entry` flag:
 *
 *   "size" / "pos"        → number | (keyof Datum & string) | MaybeValue<T>
 *   "color"               → string | (keyof Datum & string) | MaybeValue<string>
 *   entry-flagged "size"  → (keyof Datum & string) | MaybeValue<T>[]
 *   entry-flagged "pos"   → (keyof Datum & string) | MaybeValue<T>[]
 *   entry-flagged "color" → (keyof Datum & string) | MaybeValue<string>[]
 *
 * The entry forms don't accept a scalar because the layout function expects
 * an array (one value per child) when the channel is entry-based.
 */
type ChannelInput<Spec, Datum> = Spec extends { type: infer Type; entry: true }
  ? Type extends "size"
    ? (keyof Datum & string) | MaybeValue<number>[] | undefined
    : Type extends "pos"
      ? (keyof Datum & string) | MaybeValue<number>[] | undefined
      : Type extends "color"
        ? (keyof Datum & string) | MaybeValue<string>[] | undefined
        : never
  : Spec extends "size" | { type: "size" }
    ? number | (keyof Datum & string) | Value<number> | undefined
    : Spec extends "pos" | { type: "pos" }
      ? number | (keyof Datum & string) | Value<number> | undefined
      : Spec extends "color" | { type: "color" }
        ? string | (keyof Datum & string) | Value<string> | undefined
        : never;

/**
 * Derive the user-facing options type from a low-level layout's props type
 * and a set of channel annotations. Channel-annotated keys get the
 * channel-input widening; other keys pass through unchanged.
 */
export type DeriveOperatorOptions<LayoutProps, Channels, Datum> = {
  [K in keyof LayoutProps]: K extends keyof Channels
    ? Channels[K] extends undefined
      ? LayoutProps[K]
      : ChannelInput<NonNullable<Channels[K]>, Datum>
    : LayoutProps[K];
};

/** The low-level layout function passed as createOperator's first arg. */
export type LayoutFn<Options> = (
  opts: Options,
  children: GoFishAST[]
) => GoFishAST | PromiseLike<GoFishAST | PromiseLike<GoFishAST>>;

/**
 * Config for createOperator (second positional arg).
 *
 * - `split` (required): split the data into an ordered Map of (key, subdata)
 *   entries. Can also return `keys` — axis labels (colKeys/rowKeys for table)
 *   that merge into opts before `layout` is called.
 * - `channels` (optional): per-opt data-aware encodings, applied to the opts
 *   before they reach `layout`. Mirrors createMark's channel annotations.
 *
 * Combinator form is mechanical: the factory enumerates the marks array with
 * integer keys and applies each mark to the shared data. No user hook.
 *
 * Note: the high-level `Options` type should match the low-level `layout`
 * function's opts shape. If you find yourself wanting a translation layer,
 * change one side's naming to match the other rather than threading an
 * adapter through the factory.
 */
export type OperatorConfig<Datum, Options> = {
  split: (opts: Options, d: Datum[]) => SplitResult<Datum>;
  channels?: ChannelAnnotations<Options>;
};

export type DualModeOperator<Datum, Options> = {
  (opts: Options): Operator<Datum[], Datum[]>;
  (opts: Options, marks: Mark<Datum>[]): NameableMark<Datum>;
};

/** Run a single channel inference over a data slice. */
function runChannel(type: ChannelType, val: any, data: any[]): any {
  if (type === "size") return inferSize(val, data);
  if (type === "pos") return inferPos(val, data);
  if (type === "color") return inferColor(val, data);
  return val;
}

/**
 * Apply channel annotations: runs inferSize/inferPos/inferColor on the
 * specified opts keys, returning a new opts object.
 *
 * - Plain channels ("size"/"pos"/"color") aggregate over all of `d` and
 *   produce a single value.
 * - Entry-flagged channels (`{type, entry: true}`) run once per split entry
 *   and collect the results into an array, one value per entry.
 * - If the opts value is already an array, channels pass it through unchanged
 *   (user supplied the final form directly).
 */
function applyChannels<Options extends Record<string, any>>(
  opts: Options,
  channels: ChannelAnnotations<Options> | undefined,
  d: any,
  entries: Map<string | number, any[]> | undefined
): Options {
  if (!channels) return opts;
  const wholeData = Array.isArray(d) ? d : [d];
  const out: any = { ...opts };
  for (const key of Object.keys(channels) as Array<keyof Options>) {
    const spec = channels[key];
    const val = out[key];
    if (val === undefined || spec === undefined) continue;
    // User already supplied the final-form array — leave it alone.
    if (Array.isArray(val)) continue;
    const type: ChannelType = typeof spec === "string" ? spec : spec.type;
    const perEntry = typeof spec === "object" && spec.entry === true;
    if (perEntry && entries !== undefined) {
      out[key] = [...entries.values()].map((items) =>
        runChannel(type, val, items)
      );
    } else {
      out[key] = runChannel(type, val, wholeData);
    }
  }
  return out as Options;
}

/**
 * Factory-only opts that never flow through to the low-level `layout` function.
 * `by`: the universal split-spec key.
 * `debug`: diagnostic-only, handled inside `split` if at all.
 */
const FACTORY_ONLY_KEYS = new Set<string>(["by", "debug"]);

/** Strip factory-only keys from opts before passing to `layout`. */
function stripFactoryKeys<Options extends Record<string, any>>(
  opts: Options
): Options {
  const out: any = {};
  for (const [k, v] of Object.entries(opts)) {
    if (!FACTORY_ONLY_KEYS.has(k)) out[k] = v;
  }
  return out as Options;
}

/** Build the low-level opts passed to `layout`. */
function buildLayoutOpts<Datum, Options>(
  channels: ChannelAnnotations<Options> | undefined,
  opts: Options,
  d: Datum | Datum[],
  entries: Map<string | number, Datum[]> | undefined,
  keys: Record<string, string[]> | undefined
): Options {
  const withChannels = applyChannels(opts as any, channels, d, entries);
  const stripped = stripFactoryKeys(withChannels);
  // Merge split's axis keys (e.g. colKeys, rowKeys for table) into opts.
  return keys !== undefined ? ({ ...stripped, ...keys } as Options) : stripped;
}

/**
 * Factory that turns a low-level `layout` function plus `{split, channels}`
 * config into a layout operator with both combinator and operator (traversal)
 * forms.
 *
 * Signature mirrors `createMark(shapeFn, channels)` — low-level builder
 * first, config second.
 */
export function createOperator<Datum, Options>(
  layout: LayoutFn<Options>,
  cfg: OperatorConfig<Datum, Options>
): DualModeOperator<Datum, Options> {
  function dual(opts: Options): Operator<Datum[], Datum[]>;
  function dual(opts: Options, marks: Mark<Datum>[]): NameableMark<Datum>;
  function dual(
    opts: Options,
    marks?: Mark<Datum>[]
  ): Operator<Datum[], Datum[]> | NameableMark<Datum> {
    if (marks !== undefined) {
      // Combinator form: apply each mark to the same data d, then layout.
      const base: Mark<Datum> = async (
        d: Datum,
        key?: string | number,
        layerContext?: LayerContext
      ) => {
        const nodes = await Promise.all(
          marks.map(async (mark, i) => {
            const currentKey = key != undefined ? `${key}-${i}` : i;
            return resolveMarkResult(
              mark(d as any, currentKey, layerContext),
              layerContext
            );
          })
        );
        const lowOpts = buildLayoutOpts(
          cfg.channels,
          opts,
          d,
          undefined,
          undefined
        );
        const node = (await layout(lowOpts, nodes)) as GoFishNode;
        (node as any).datum = d;
        return node;
      };
      return nameableMark(base);
    }
    // Operator (traversal) form: split d, apply one mark per leaf, layout.
    const operator: Operator<Datum[], Datum[]> = async (mark) => {
      return (async (
        d: Datum[],
        key?: string | number,
        layerContext?: LayerContext
      ) => {
        const splitResult = cfg.split(opts, d);
        const entries =
          splitResult instanceof Map ? splitResult : splitResult.entries;
        const keys = splitResult instanceof Map ? undefined : splitResult.keys;
        const nodes = await Promise.all(
          [...entries.entries()].map(async ([i, leaf]) => {
            const currentKey = key != undefined ? `${key}-${i}` : i;
            const node = await resolveMarkResult(
              mark(leaf, currentKey, layerContext),
              layerContext
            );
            node.setKey(currentKey?.toString() ?? "");
            return node;
          })
        );
        const lowOpts = buildLayoutOpts(cfg.channels, opts, d, entries, keys);
        return (await layout(lowOpts, nodes)) as unknown as GoFishNode;
      }) as Mark<Datum[]>;
    };
    return operator;
  }
  return dual as DualModeOperator<Datum, Options>;
}
