import { For } from "solid-js";
import { GoFishNode, Placeable } from "../_node";
import { getMeasure, getValue, isValue, MaybeValue, Value } from "../data";
import {
  Direction,
  elaborateDims,
  elaborateDirection,
  FancyDims,
  FancyDirection,
  FancySize,
  Size,
} from "../dims";
import _, { Collection, size } from "lodash";
import { computeAesthetic, computeSize, findTargetMonotonic } from "../../util";
import { GoFishAST } from "../_ast";
import { createNodeOperator } from "../withGoFish";
import * as Monotonic from "../../util/monotonic";
import {
  ORDINAL,
  POSITION,
  UNDEFINED,
  isPOSITION,
  isSIZE,
} from "../underlyingSpace";
import { UnderlyingSpace } from "../underlyingSpace";
import * as Interval from "../../util/interval";
import { Alignment, alignChildren, resolveAlignmentSpace } from "./alignment";
import { createOperator } from "../marks/createOperator";
import { Mark, Operator } from "../types";

// Utility function to unwrap lodash wrapped arrays
const unwrapLodashArray = function <T>(value: T[] | Collection<T>): T[] {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as Collection<T>).value() as T[];
  }
  return value as T[];
};

export const Spread = createNodeOperator(
  (
    {
      name,
      key,
      dir,
      spacing = 8,
      alignment = "baseline",
      sharedScale = false,
      mode = "edge",
      reverse = false,
      ...fancyDims
    }: {
      name?: string;
      key?: string;
      dir: FancyDirection;
      spacing?: number;
      alignment?: Alignment;
      sharedScale?: boolean;
      mode?: "edge" | "center";
      reverse?: boolean;
    } & FancyDims<MaybeValue<number>>,
    children: GoFishAST[] | Collection<GoFishAST>
  ) => {
    // Unwrap lodash wrapped children if needed
    children = unwrapLodashArray(children);

    const stackDir = elaborateDirection(dir);
    const alignDir = (1 - stackDir) as Direction;
    // track whether align axis came from SIZE so we still perform baseline alignment even with posScales
    let alignFromSize = false;
    const dims = elaborateDims(fancyDims);

    return new GoFishNode(
      {
        type: "spread",
        args: {
          key,
          name,
          dir,
          spacing,
          alignment,
          sharedScale,
          mode,
          reverse,
          dims,
        },
        key,
        name,
        shared: [sharedScale, sharedScale],
        resolveUnderlyingSpace: (
          children: Size<UnderlyingSpace>[],
          childNodes: GoFishAST[]
        ) => {
          /* ALIGNMENT RULES */
          const alignSpaces = children.map((child) => child[alignDir]);
          const alignResult = resolveAlignmentSpace(alignSpaces, alignment);
          const alignSpace = alignResult.space;
          alignFromSize = alignResult.fromSize;

          /* SPACING RULES */
          let stackSpace = UNDEFINED;
          const stackSpaces = children.map((child) => child[stackDir]);

          // if children are all UNDEFINED or POSITION and spacing is 0, return POSITION
          if (
            children.every(
              (child) =>
                // child[stackDir].kind === "undefined" ||
                child[stackDir].kind === "position"
            ) &&
            spacing === 0
          ) {
            // position's domain should be [0, sum(widths of child intervals)] using the interval library
            const totalWidth = children
              .map((child) => {
                const domain = isPOSITION(child[stackDir])
                  ? child[stackDir].domain
                  : undefined;
                return domain ? Interval.width(domain) : 0;
              })
              .reduce((a, b) => a + b, 0);
            stackSpace = POSITION(Interval.interval(0, totalWidth));
          }
          // if children are all SIZE and spacing is 0, return POSITION (sum of sizes)
          else if (stackSpaces.every((s) => isSIZE(s)) && spacing === 0) {
            const sizeValues = stackSpaces.map(
              (s) => (s as any).value as number
            );
            const totalSize = sizeValues.reduce((a, b) => a + b, 0);
            stackSpace = POSITION(Interval.interval(0, totalSize));
          }
          // if children are named (data-driven) and free (no inherent position), return ORDINAL
          else {
            const topLevelKeys = childNodes
              .filter((node): node is GoFishNode => node instanceof GoFishNode)
              .map((node) => node.key)
              .filter((key): key is string => key !== undefined);

            if (topLevelKeys.length > 0) {
              stackSpace = ORDINAL(topLevelKeys);
            }
          }

          return {
            [stackDir]: stackSpace,
            [alignDir]: alignSpace,
          };
        },
        inferSizeDomains: (shared, children) => {
          const childSizeDomains = children.map((child) =>
            child.inferSizeDomains()
          );
          const childSizeDomainsStackDir = childSizeDomains.map(
            (childSizeDomain) => childSizeDomain[stackDir]
          );
          const childSizeDomainsAlignDir = childSizeDomains.map(
            (childSizeDomain) => childSizeDomain[alignDir]
          );

          return {
            [stackDir]:
              mode === "edge"
                ? isValue(dims[stackDir].size)
                  ? Monotonic.linear(getValue(dims[stackDir].size!), 0)
                  : Monotonic.adds(
                      Monotonic.add(...childSizeDomainsStackDir),
                      spacing * (children.length - 1)
                    )
                : // TODO: optimize this case...
                  Monotonic.unknown(
                    (scaleFactor: number) =>
                      childSizeDomainsStackDir[0].run(scaleFactor) / 2 +
                      spacing * (children.length - 1) +
                      childSizeDomainsStackDir[
                        childSizeDomainsStackDir.length - 1
                      ].run(scaleFactor) /
                        2
                  ),
            [alignDir]: isValue(dims[alignDir].size)
              ? Monotonic.linear(getValue(dims[alignDir].size!), 0)
              : Monotonic.max(...childSizeDomainsAlignDir),
          };
        },
        layout: (
          shared,
          size,
          scaleFactors,
          children,
          measurement,
          posScales,
          node
        ) => {
          if (reverse) {
            children = children.reverse();
          }
          const stackPos = computeAesthetic(
            dims[stackDir].min,
            posScales?.[stackDir]!,
            undefined
          );
          const alignPos = computeAesthetic(
            dims[alignDir].min,
            posScales?.[alignDir]!,
            undefined
          );

          size = {
            [stackDir]: computeSize(
              dims[stackDir].size,
              scaleFactors?.[stackDir]!,
              size[stackDir]
            ),
            [alignDir]: computeSize(
              dims[alignDir].size,
              scaleFactors?.[alignDir]!,
              size[alignDir]
            ),
          };

          if (shared[stackDir]) {
            const stackScaleFactor =
              measurement[stackDir].inverse(size[stackDir], {
                upperBoundGuess: size[stackDir],
              }) ?? 0;
            scaleFactors[stackDir] = stackScaleFactor;
          }

          if (shared[alignDir]) {
            const alignScaleFactor =
              measurement[alignDir].inverse(size[alignDir], {
                upperBoundGuess: size[alignDir],
              }) ?? 0;
            scaleFactors[alignDir] = alignScaleFactor;
          }

          // console.log(size, scaleFactors, posScales);
          const scaleContext = node.getRenderSession().scaleContext;
          scaleContext.x = {
            domain: [0, size[0] / scaleFactors[0]],
            scaleFactor: scaleFactors[0],
          };
          scaleContext.y = {
            domain: [0, size[1] / scaleFactors[1]],
            scaleFactor: scaleFactors[1],
          };

          // Calculate available space for children in stacking direction after subtracting spacing
          const totalSpacing = spacing * (children.length - 1);
          const availableStackSpace = size[stackDir] - totalSpacing;
          const childStackSize = availableStackSpace / children.length;

          // Create modified size with equal distribution for stacking direction
          const modifiedSize: Size = [0, 0];
          modifiedSize[stackDir] = childStackSize;
          modifiedSize[alignDir] = size[alignDir];
          // console.log(size[stackDir], size[alignDir]);

          const childPlaceables = children.map((child) =>
            child.layout(modifiedSize, scaleFactors, posScales)
          );

          // Fixed-position children have dims already defined (e.g. Ref to another layer)
          const isFixed = (dir: Direction) => (child: Placeable) =>
            child.dims[dir].min !== undefined;
          const alignmentToDim = {
            start: "min",
            middle: "center",
            end: "max",
            baseline: "min",
          } as const;
          const getBaseline = (dir: Direction) => (child: Placeable) =>
            child.dims[dir][alignmentToDim[alignment]!]!;
          const isClose = (a: number, b: number) => Math.abs(a - b) < 1e-6;

          // Align-direction consistency: check before placing (when >= 2 fixed)
          const fixedChildren = childPlaceables.filter(isFixed(alignDir));
          if (fixedChildren.length >= 2) {
            const baselines = fixedChildren.map(getBaseline(alignDir));
            const allSameBaseline = baselines.every((b) =>
              isClose(b!, baselines[0]!)
            );
            if (!allSameBaseline) {
              console.warn(
                "Stack: fixed children have inconsistent align-direction positions",
                { alignment, baselines }
              );
            }
          }

          /* align */
          alignChildren(
            childPlaceables,
            alignDir,
            alignment,
            size[alignDir],
            posScales?.[alignDir],
            alignFromSize
          );

          /* distribute */
          const firstFixedIdx = childPlaceables.findIndex(isFixed(stackDir));
          let pos: number;
          if (firstFixedIdx === -1) {
            pos = 0;
          } else {
            const firstFixed = childPlaceables[firstFixedIdx];
            const firstFixedMin = firstFixed.dims[stackDir].min as number;
            const firstFixedMax = firstFixed.dims[stackDir].max as number;
            const firstFixedCenter = (firstFixedMin + firstFixedMax) / 2;
            if (mode === "edge") {
              pos =
                firstFixedMin -
                firstFixedIdx * spacing -
                childPlaceables
                  .slice(0, firstFixedIdx)
                  .reduce((acc, c) => acc + c.dims[stackDir].size!, 0);
            } else {
              pos = firstFixedCenter - firstFixedIdx * spacing;
            }
          }

          if (mode === "edge") {
            for (const child of childPlaceables) {
              if (isFixed(stackDir)(child)) {
                const childMin = child.dims[stackDir].min as number;
                const childMax = child.dims[stackDir].max as number;
                if (Math.abs(childMin - pos) > 1e-6) {
                  console.warn(
                    "Stack: fixed child stack-direction position inconsistent with layout order",
                    { expected: pos, actual: childMin }
                  );
                }
                pos = childMax + spacing;
              } else {
                child.place(stackDir, pos, "min");
                const sz = child.dims[stackDir].size ?? 0;
                pos += sz + spacing;
              }
            }
          } else if (mode === "center") {
            for (const child of childPlaceables) {
              if (isFixed(stackDir)(child)) {
                const childMin = child.dims[stackDir].min as number;
                const childMax = child.dims[stackDir].max as number;
                const childCenter = (childMin + childMax) / 2;
                if (Math.abs(childCenter - pos) > 1e-6) {
                  console.warn(
                    "Stack: fixed child stack-direction position inconsistent (center-to-center)",
                    { expected: pos, actual: childCenter }
                  );
                }
                pos = childCenter + spacing;
              } else {
                child.place(stackDir, pos, "center");
                pos += spacing;
              }
            }
          }

          // Compute alignDir intrinsicDims from extents to account for negative bars
          const alignMin = Math.min(
            ...childPlaceables.map((child) => child.dims[alignDir].min!)
          );
          const alignMax = Math.max(
            ...childPlaceables.map((child) => child.dims[alignDir].max!)
          );
          const stackMin = Math.min(
            ...childPlaceables.map((child) => child.dims[stackDir].min!)
          );
          const stackMax = Math.max(
            ...childPlaceables.map((child) => child.dims[stackDir].max!)
          );
          const alignSize = alignMax - alignMin;
          const stackSize = stackMax - stackMin;
          const translateAlign =
            alignPos !== undefined ? alignPos - alignMin : undefined;

          return {
            intrinsicDims: {
              [alignDir]: {
                min: alignMin,
                size: alignSize,
                center: alignMin + alignSize / 2,
                max: alignMax,
              },
              [stackDir]: {
                min: stackMin,
                size: stackSize,
                center: stackMin + stackSize / 2,
                max: stackMax,
              },
            },
            transform: {
              translate: {
                [alignDir]: translateAlign,
                [stackDir]:
                  stackPos !== undefined ? stackPos - stackMin : undefined,
              },
            },
          };
        },
        render: ({ intrinsicDims, transform }, children) => {
          return (
            <g
              transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}
            >
              {children}
            </g>
          );
        },
      },
      children
    );
  }
);

export type SpreadOptions<T = any> = {
  by?: keyof T & string;
  dir: "x" | "y";
  spacing?: number;
  alignment?: "start" | "middle" | "end" | "baseline";
  sharedScale?: boolean;
  mode?: "edge" | "center";
  reverse?: boolean;
  w?: number | (keyof T & string);
  h?: number | (keyof T & string);
  debug?: boolean;
};

export const spread = createOperator<any, SpreadOptions>(Spread, {
  // When no `by` is given, pass each item through as-is. Items may already be
  // arrays (e.g. after `_.chunk(...)`) or scalars; the downstream mark
  // normalizes either form internally.
  split: ({ by }, d) =>
    by ? Map.groupBy(d, (r: any) => r[by]) : new Map(d.map((r, i) => [i, r])),
  channels: { w: "size", h: "size" },
  axisFields: ({ by, dir }) =>
    by ? (dir === "x" ? { x: by } : { y: by }) : undefined,
});

/** Stack has no `spacing` option — children always touch (spacing: 0). */
export type StackOptions<T = any> = Omit<SpreadOptions<T>, "spacing">;

export function stack(
  opts: StackOptions,
  marks: Mark<any>[]
): ReturnType<typeof spread>;
export function stack(opts: StackOptions): Operator<any[], any[]>;
export function stack(
  opts: StackOptions,
  marks?: Mark<any>[]
): ReturnType<typeof spread> | Operator<any[], any[]> {
  const stackOpts: SpreadOptions = { ...opts, spacing: 0 };
  return marks !== undefined ? spread(stackOpts, marks) : spread(stackOpts);
}
