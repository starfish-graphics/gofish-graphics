import { For } from "solid-js";
import { GoFishNode } from "../_node";
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
import { withGoFish } from "../withGoFish";
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

export const stack = withGoFish(
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
        type: "stack",
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
        resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
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
          else if (alignSpaces.every((s) => isPOSITION(s))) {
            alignFromSize = false;
            const childDomains = alignSpaces.map((s) => (s as any).domain);
            const domain = Interval.unionAll(...childDomains);
            alignSpace = POSITION(domain);
          } else {
            alignFromSize = false;
            alignSpace = UNDEFINED;
          }

          /* SPACING RULES */
          let stackSpace = UNDEFINED;
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
                const domain = child[stackDir].domain;
                return domain ? Interval.width(domain) : 0;
              })
              .reduce((a, b) => a + b, 0);
            stackSpace = POSITION(Interval.interval(0, totalWidth));
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
            stackSpace = ORDINAL;
          } else {
            stackSpace = ORDINAL;
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

          /* align */
          // Skip alignment if children have position scales (they already have data-driven positions),
          // UNLESS the align space came from SIZE (no inherent position) and we need baseline alignment.
          if (!posScales?.[alignDir] || alignFromSize) {
            if (alignment === "start") {
              // For "start" alignment with mixed positive/negative bars, align at the baseline (0 in data space)
              const baselinePos = posScales?.[alignDir]
                ? posScales[alignDir](0)
                : 0;
              for (const child of childPlaceables) {
                child.place({ [alignDir]: baselinePos });
              }
            } else if (alignment === "middle") {
              // For "middle" alignment, center children in the available space
              const centerPos = size[alignDir] / 2;
              for (const child of childPlaceables) {
                child.place({
                  [alignDir]: centerPos - child.dims[alignDir].size! / 2,
                });
              }
            } else if (alignment === "end") {
              // For "end" alignment with mixed positive/negative bars, align at the baseline (0 in data space)
              const baselinePos = posScales?.[alignDir]
                ? posScales[alignDir](0)
                : 0;
              for (const child of childPlaceables) {
                child.place({
                  [alignDir]: baselinePos - child.dims[alignDir].size!,
                });
              }
            }
          }

          /* distribute */
          let pos = 0;
          if (mode === "edge-to-edge") {
            for (const child of childPlaceables) {
              child.place({ [stackDir]: pos });
              pos += child.dims[stackDir].size! + spacing;
            }
          } else if (mode === "center-to-center") {
            for (const child of childPlaceables) {
              child.place({ [stackDir]: pos - child.dims[stackDir].size! / 2 });
              pos += spacing;
            }
          }

          // Compute alignDir intrinsicDims from extents to account for negative bars
          const alignMin = Math.min(
            ...childPlaceables.map((child) => child.dims[alignDir].min!)
          );
          const alignMax = Math.max(
            ...childPlaceables.map((child) => child.dims[alignDir].max!)
          );
          const alignSize = alignMax - alignMin;
          const translateAlign =
            alignPos !== undefined ? alignPos - alignMin : undefined;

          return {
            intrinsicDims: {
              [alignDir]: {
                min: alignMin,
                size: alignSize,
                max: alignMax,
              },
              [stackDir]: {
                min: 0,
                size: pos,
                center: pos / 2,
                max: pos,
              },
            },
            transform: {
              translate: {
                [alignDir]: translateAlign,
                [stackDir]: stackPos !== undefined ? stackPos : undefined,
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
