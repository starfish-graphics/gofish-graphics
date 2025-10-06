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
import {
  canUnifyDomains,
  continuous,
  ContinuousDomain,
  Domain,
  unifyContinuousDomains,
} from "../domain";
import { computeAesthetic, computeSize, findTargetMonotonic } from "../../util";
import { GoFishAST } from "../_ast";
import { getScaleContext } from "../gofish";
import { withGoFish } from "../withGoFish";
import * as Monotonic from "../../util/monotonic";
import {
  INTERVAL,
  ORDINAL,
  POSITION,
  UNDEFINED,
  isPOSITION,
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
    const dims = elaborateDims(fancyDims);

    return new GoFishNode(
      {
        type: "stack",
        key,
        name,
        shared: [sharedScale, sharedScale],
        resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
          /* ALIGNMENT RULES */
          let alignSpace = UNDEFINED;

          // if children are all UNDEFINED or POSITION and alignment is start or end, return POSITION
          if (
            children.every((child) => isPOSITION(child[alignDir])) &&
            (alignment === "start" || alignment === "end")
          ) {
            const domain = Interval.unionAll(
              ...children.map((child) => child[alignDir].domain!)
            );
            alignSpace = POSITION([domain.min, domain.max]);
          }
          // if children are all UNDEFINED or POSITION and alignment is middle, return INTERVAL
          else if (
            children.every((child) => isPOSITION(child[alignDir])) &&
            alignment === "middle"
          ) {
            const domain = Interval.unionAll(
              ...children.map((child) => child[alignDir].domain!)
            );
            alignSpace = INTERVAL(Interval.width(domain));
          } else {
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
            stackSpace = POSITION(
              totalWidth >= 0 ? [0, totalWidth] : [totalWidth, 0]
            );
          }

          // if children are all UNDEFINED or POSITION and spacing is > 0, return ORDINAL
          else if (
            children.every(
              (child) =>
                child[stackDir].kind === "undefined" ||
                child[stackDir].kind === "position"
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
        inferPosDomains: (childPosDomains: Size<Domain>[]) => {
          // For the stacking dimension, unify domains like in layer
          // console.log("stack.inferPosDomains", { childPosDomains });
          const filteredStackDirChildDomains = childPosDomains
            .map((childPosDomain) => childPosDomain[stackDir])
            .filter((d) => d !== undefined);

          const filteredAlignDirChildDomains = childPosDomains
            .map((childPosDomain) => childPosDomain[alignDir])
            .filter((d) => d !== undefined);

          const result = [undefined, undefined] as (
            | ContinuousDomain
            | undefined
          )[];

          if (
            filteredStackDirChildDomains.length > 0 &&
            canUnifyDomains(filteredStackDirChildDomains)
          ) {
            result[stackDir] = unifyContinuousDomains(
              filteredStackDirChildDomains
            );
          } else if (isValue(dims[stackDir].min)) {
            result[stackDir] = continuous({
              value: [
                getValue(dims[stackDir].min)!,
                getValue(dims[stackDir].min)!,
              ],
              measure: getMeasure(dims[stackDir].min),
            });
          }

          if (
            filteredAlignDirChildDomains.length > 0 &&
            canUnifyDomains(filteredAlignDirChildDomains)
          ) {
            result[alignDir] = unifyContinuousDomains(
              filteredAlignDirChildDomains
            );
          } else if (isValue(dims[alignDir].min)) {
            result[alignDir] = continuous({
              value: [
                getValue(dims[alignDir].min)!,
                getValue(dims[alignDir].min)!,
              ],
              measure: getMeasure(dims[alignDir].min),
            });
          }

          return result;
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
          if (alignment === "start") {
            for (const child of childPlaceables) {
              child.place({ [alignDir]: 0 });
            }
          } else if (alignment === "middle") {
            for (const child of childPlaceables) {
              child.place({ [alignDir]: -child.dims[alignDir].size! / 2 });
            }
          } else if (alignment === "end") {
            for (const child of childPlaceables) {
              child.place({ [alignDir]: -child.dims[alignDir].size! });
            }
          }

          let alignMin: number;
          if (alignment === "start") {
            alignMin = 0;
          } else if (alignment === "middle") {
            alignMin = Math.min(
              ...childPlaceables.map((child) => -child.dims[alignDir].size! / 2)
            );
          } /* if (alignment === "end") */ else {
            alignMin = Math.min(
              ...childPlaceables.map((child) => -child.dims[alignDir].size!)
            );
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

          const alignSize = Math.max(
            ...childPlaceables.map((child) => child.dims[alignDir].size!)
          );
          return {
            intrinsicDims: {
              [alignDir]: {
                min: alignMin,
                size: alignSize,
                max: alignMin + alignSize,
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
                [alignDir]:
                  alignPos !== undefined ? alignPos - alignMin : undefined,
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
