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
import { getScaleContext } from "../gofish";
import { createOperator } from "../withGoFish";
import * as Monotonic from "../../util/monotonic";
import {
  DIFFERENCE,
  ORDINAL,
  POSITION,
  UNDEFINED,
  isDIFFERENCE,
  isPOSITION,
  isSIZE,
} from "../underlyingSpace";
import { UnderlyingSpace } from "../underlyingSpace";
import * as Interval from "../../util/interval";

// Utility function to unwrap lodash wrapped arrays
const unwrapLodashArray = function <T>(value: T[] | Collection<T>): T[] {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as Collection<T>).value() as T[];
  }
  return value as T[];
};

export const spread = createOperator(
  (
    {
      name,
      key,
      direction,
      spacing = 0,
      alignment = "middle",
      sharedScale = false,
      mode = "edge-to-edge",
      reverse = false,
      ...fancyDims
    }: {
      name?: string;
      key?: string;
      direction: FancyDirection;
      spacing?: number;
      alignment?: "start" | "middle" | "end";
      sharedScale?: boolean;
      mode?: "edge-to-edge" | "center-to-center";
      reverse?: boolean;
    } & FancyDims<MaybeValue<number>>,
    children: GoFishAST[] | Collection<GoFishAST>
  ) => {
    // Unwrap lodash wrapped children if needed
    children = unwrapLodashArray(children);

    const stackDir = elaborateDirection(direction);
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
          direction,
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
          let alignSpace = UNDEFINED;

          const alignSpaces = children.map((child) => child[alignDir]);

          // children are all SIZE
          if (alignSpaces.every((s) => isSIZE(s))) {
            alignFromSize = true;
            const sizeValues = alignSpaces.map(
              (s) => (s as any).value as number
            );

            if (alignment === "start" || alignment === "end") {
              // Merge SIZE into POSITION by treating each size as an interval from 0 to size
              const intervals = sizeValues.map((v) => Interval.interval(0, v));
              const domain = Interval.unionAll(...intervals);
              alignSpace = POSITION(domain);
            } else if (alignment === "middle") {
              // Middle alignment: treat as DIFFERENCE, using the maximum absolute size
              const maxWidth = Math.max(...sizeValues.map((v) => Math.abs(v)));
              alignSpace = DIFFERENCE(maxWidth);
            } else {
              alignSpace = UNDEFINED;
            }
          }
          // children are all DIFFERENCE
          else if (alignSpaces.every((s) => isDIFFERENCE(s))) {
            alignFromSize = false;
            const widths = alignSpaces.map((s) => (s as any).width as number);
            const maxWidth = Math.max(...widths);
            alignSpace = DIFFERENCE(maxWidth);
          }
          // children are all POSITION -> POSITION (union domains, but layout will not realign)
          // OR DIFFERENCE if alignment is "middle" (for streamgraph-style centering)
          else if (alignSpaces.every((s) => isPOSITION(s))) {
            alignFromSize = false;
            const childDomains = alignSpaces.map((s) => (s as any).domain);
            const domain = Interval.unionAll(...childDomains);
            if (alignment === "middle") {
              // For middle alignment with POSITION children, use DIFFERENCE space
              const maxWidth = Interval.width(domain);
              alignSpace = DIFFERENCE(maxWidth);
            } else {
              alignSpace = POSITION(domain);
            }
          } else {
            alignFromSize = false;
            alignSpace = UNDEFINED;
          }

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
          // if children are all UNDEFINED or POSITION and spacing is > 0, return ORDINAL
          else if (
            children.every(
              (child) =>
                child[stackDir].kind === "undefined" ||
                child[stackDir].kind === "position" ||
                child[stackDir].kind === "size" // SIZE along stackDir behaves like position extents for spacing
            ) &&
            spacing > 0
          ) {
            // Extract top-level keys from child nodes for ordinal domain
            const topLevelKeys = childNodes
              .filter((node): node is GoFishNode => node instanceof GoFishNode)
              .map((node) => node.key)
              .filter((key): key is string => key !== undefined);
            stackSpace = ORDINAL(topLevelKeys);
          } else {
            // Extract top-level keys from child nodes for ordinal domain
            const topLevelKeys = childNodes
              .filter((node): node is GoFishNode => node instanceof GoFishNode)
              .map((node) => node.key)
              .filter((key): key is string => key !== undefined);
            stackSpace = ORDINAL(topLevelKeys);
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
              mode === "edge-to-edge"
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
          posScales
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
          const scaleContext = getScaleContext();
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
          // Skip alignment if children have position scales (they already have data-driven positions),
          // UNLESS the align space came from SIZE (no inherent position) and we need baseline alignment,
          // OR alignment is "middle" (which requires centering regardless of position scales).
          if (
            !posScales?.[alignDir] ||
            alignFromSize ||
            alignment === "middle"
          ) {
            if (alignment === "start") {
              const baseline =
                fixedChildren.length > 0
                  ? getBaseline(alignDir)(fixedChildren[0])
                  : posScales?.[alignDir]
                    ? posScales[alignDir](0)
                    : 0;
              for (let i = 0; i < childPlaceables.length; i++) {
                const child = childPlaceables[i];
                if (isFixed(alignDir)(child)) continue;
                child.place({ [alignDir]: baseline });
              }
            } else if (alignment === "middle") {
              const baseline =
                fixedChildren.length > 0
                  ? getBaseline(alignDir)(fixedChildren[0])
                  : size[alignDir] / 2;
              for (let i = 0; i < childPlaceables.length; i++) {
                const child = childPlaceables[i];
                if (isFixed(alignDir)(child)) continue;
                child.place({
                  [alignDir]: baseline - child.dims[alignDir].size! / 2,
                });
              }
            } else if (alignment === "end") {
              const baseline =
                fixedChildren.length > 0
                  ? getBaseline(alignDir)(fixedChildren[0])
                  : posScales?.[alignDir]
                    ? posScales[alignDir](0)
                    : 0;
              for (let i = 0; i < childPlaceables.length; i++) {
                const child = childPlaceables[i];
                if (isFixed(alignDir)(child)) continue;
                child.place({
                  [alignDir]: baseline - child.dims[alignDir].size!,
                });
              }
            }
          }

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
            if (mode === "edge-to-edge") {
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

          if (mode === "edge-to-edge") {
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
                child.place({ [stackDir]: pos });
                const sz = child.dims[stackDir].size ?? 0;
                pos += sz + spacing;
              }
            }
          } else if (mode === "center-to-center") {
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
                const sz = child.dims[stackDir].size ?? 0;
                child.place({ [stackDir]: pos - sz / 2 });
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
