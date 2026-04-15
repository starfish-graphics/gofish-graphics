import { color6, color6_old } from "../../color";
import { path, Path, pathToSVGPath, segment, transformPath } from "../../path";
import { GoFishNode } from "../_node";
import { GoFishAST } from "../_ast";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { linear } from "../coordinateTransforms/linear";
import {
  getMeasure,
  getValue,
  inferEmbedded,
  isAesthetic,
  isValue,
  MaybeValue,
  value,
  Value,
} from "../data";
import {
  Dimensions,
  elaborateDims,
  FancyDims,
  FancySize,
  Size,
  Transform,
} from "../dims";
import { aesthetic, continuous, Domain } from "../domain";
import * as Monotonic from "../../util/monotonic";
import { computeAesthetic, computeSize } from "../../util";
import {
  DIFFERENCE,
  ORDINAL,
  POSITION,
  SIZE,
  UNDEFINED,
  UnderlyingSpace,
} from "../underlyingSpace";
import { interval } from "../../util/interval";
import { createMark } from "../withGoFish";

const computeIntrinsicSize = (
  input: MaybeValue<number> | undefined
): Monotonic.Monotonic => {
  return isValue(input)
    ? Monotonic.linear(getValue(input)!, 0)
    : Monotonic.linear(0, input ?? 0);
};

const DEFAULT_RECT_SIZE = 16;

/* TODO: what should default embedding behavior be when all values are aesthetic? */
export const Rect = ({
  key,
  name,
  fill = color6[0],
  stroke = fill,
  strokeWidth = 0,
  rx = 0,
  ry = 0,
  filter,
  label,
  aspectRatio,
  ...fancyDims
}: {
  key?: string;
  name?: string;
  fill?: MaybeValue<string>;
  stroke?: MaybeValue<string>;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
  filter?: string;
  label?: boolean;
  /** w/h ratio to enforce. w = h * aspectRatio. When both dims are data-driven,
   *  the constraining axis (smaller of the two scaled sizes) is used. */
  aspectRatio?: number;
} & FancyDims<MaybeValue<number>>) => {
  const dims = elaborateDims(fancyDims).map(inferEmbedded);
  return new GoFishNode(
    {
      name,
      key,
      type: "rect",
      args: {
        key,
        name,
        fill,
        stroke,
        strokeWidth,
        rx,
        ry,
        filter,
        label,
        dims,
      },
      // Used to seed the unit color scale. Prefer whichever channel is data-driven.
      color: isValue(fill) ? fill : stroke,
      resolveUnderlyingSpace: (
        _children: Size<UnderlyingSpace>[],
        _childNodes: GoFishAST[]
      ) => {
        /* cases
        a: aesthetic
        v: value
        u: undefined

        
        min size
        --------
        a a: ordinal
        a v: interval
        a u: ordinal
        v a: position([min, min])
        v v: position([min, min+size])
        v u: position([min, min])
        u a: ordinal
        u v: position([0, size])
        u u: ordinal


        grouped cases
        -------------
        a a: ordinal
        a u: ordinal
        u a: ordinal
        u u: ordinal

        a v: interval

        v a: position([min, min])
        v v: position([min, min+size])
        v u: position([min, min])
        u v: position([0, size])
        */

        let underlyingSpaceX = UNDEFINED;
        if (!isValue(dims[0].min) && !isValue(dims[0].size)) {
          // nothing is data-driven
          // keep undefined if no values
        } else if (isAesthetic(dims[0].min) && isValue(dims[0].size)) {
          // aesthetic position + data-driven size -> DIFFERENCE
          underlyingSpaceX = DIFFERENCE(getValue(dims[0].size)!);
        } else if (!isValue(dims[0].min) && isValue(dims[0].size)) {
          // no position, but has data-driven size -> SIZE
          underlyingSpaceX = SIZE(getValue(dims[0].size)!);
        } else {
          // has position (and possibly size) -> POSITION
          const min = isValue(dims[0].min) ? getValue(dims[0].min) : 0;
          const size = isValue(dims[0].size) ? getValue(dims[0].size) : 0;
          const domain = interval(min, min + size);
          underlyingSpaceX = POSITION(domain);
        }

        let underlyingSpaceY = UNDEFINED;
        if (!isValue(dims[1].min) && !isValue(dims[1].size)) {
          // nothing is data-driven
          // keep undefined if no values
        } else if (isAesthetic(dims[1].min) && isValue(dims[1].size)) {
          // aesthetic position + data-driven size -> DIFFERENCE
          underlyingSpaceY = DIFFERENCE(getValue(dims[1].size)!);
        } else if (!isValue(dims[1].min) && isValue(dims[1].size)) {
          // no position, but has data-driven size -> SIZE
          underlyingSpaceY = SIZE(getValue(dims[1].size)!);
        } else {
          // has position (and possibly size) -> POSITION
          const min = getValue(dims[1].min) ?? 0;
          const size = getValue(dims[1].size) ?? 0;
          const domain = interval(min, min + size);
          underlyingSpaceY = POSITION(domain);
        }

        // const w = computeIntrinsicSize(dims[0].size);
        // const h = computeIntrinsicSize(dims[1].size);

        return [underlyingSpaceX, underlyingSpaceY];
      },
      inferSizeDomains: (shared, children) => {
        const wDomain = computeIntrinsicSize(dims[0].size);
        const hDomain = computeIntrinsicSize(dims[1].size);

        if (aspectRatio !== undefined && aspectRatio > 0) {
          const wIsData = isValue(dims[0].size);
          const hIsData = isValue(dims[1].size);

          if (wIsData && !hIsData) {
            // w is primary; derive h so parent allocates the right height
            return {
              w: wDomain,
              h: Monotonic.linear(
                (wDomain as Monotonic.Linear).slope / aspectRatio,
                0
              ),
            };
          } else if (hIsData && !wIsData) {
            // h is primary; derive w so parent allocates the right width
            return {
              w: Monotonic.linear(
                (hDomain as Monotonic.Linear).slope * aspectRatio,
                0
              ),
              h: hDomain,
            };
          }
          // Both data-driven (circle) or neither: correction happens in layout()
        }

        return { w: wDomain, h: hDomain };
      },
      layout: (
        shared,
        size,
        scaleFactors,
        children,
        measurement,
        posScales
      ) => {
        const x = computeAesthetic(dims[0].min, posScales?.[0]!, undefined);
        const y = computeAesthetic(dims[1].min, posScales?.[1]!, undefined);

        let w: number | undefined;
        if (isValue(dims[0].min) && isValue(dims[0].size)) {
          // If posScales for x exists, scale min and min+size, then subtract
          const min = x;
          const max = computeAesthetic(
            value(getValue(dims[0].min)! + getValue(dims[0].size)!),
            posScales[0],
            undefined
          );
          w = max - min;
        } else if (isValue(dims[0].size) && posScales?.[0]) {
          // If we have size but no min, and posScales exists, use position scale
          // Treat min as 0 (baseline) and compute width from position scale
          const minPos = posScales[0](0);
          const maxPos = posScales[0](getValue(dims[0].size)!);
          w = maxPos - minPos;
        } else {
          w = computeSize(dims[0].size, scaleFactors?.[0]!, size[0]);
        }
        // When parent constraints are unresolved and rect width is unspecified,
        // keep a visible default instead of propagating undefined.
        if (w === undefined || !Number.isFinite(w)) {
          w = DEFAULT_RECT_SIZE;
        }

        let h: number | undefined;
        if (isValue(dims[1].min) && isValue(dims[1].size)) {
          // If posScales for y exists, scale min and min+size, then subtract
          const min = y;
          const max = computeAesthetic(
            value(getValue(dims[1].min)! + getValue(dims[1].size)!),
            posScales[1],
            undefined
          );
          h = max - min;
        } else if (isValue(dims[1].size) && posScales?.[1]) {
          // If we have size but no min, and posScales exists, use position scale
          // Treat min as 0 (baseline) and compute height from position scale
          const minPos = posScales[1](0);
          const maxPos = posScales[1](getValue(dims[1].size)!);
          h = maxPos - minPos;
        } else {
          h = computeSize(dims[1].size, scaleFactors?.[1]!, size[1]);
        }
        if (h === undefined || !Number.isFinite(h)) {
          h = DEFAULT_RECT_SIZE;
        }

        if (aspectRatio !== undefined && aspectRatio > 0) {
          const wIsData = isValue(dims[0].size);
          const hIsData = isValue(dims[1].size);

          if (wIsData && !hIsData) {
            // w is primary; derive h
            h = w / aspectRatio;
          } else if (hIsData && !wIsData) {
            // h is primary; derive w
            w = h * aspectRatio;
          } else {
            // Both data-driven or neither: contain within available space
            const containedW = Math.min(w, h * aspectRatio);
            w = containedW;
            h = containedW / aspectRatio;
          }
        }

        const result = {
          intrinsicDims: [
            {
              min: w >= 0 ? 0 : w,
              size: w,
              center: w / 2,
              max: w >= 0 ? w : 0,
              embedded: dims[0].embedded,
            },
            {
              min: h >= 0 ? 0 : h,
              size: h,
              center: h / 2,
              max: h >= 0 ? h : 0,
              embedded: dims[1].embedded,
            },
          ],
          transform: {
            translate: [x, y],
          },
        };
        return result;
      },
      render: (
        {
          intrinsicDims,
          transform,
          coordinateTransform,
        }: {
          intrinsicDims?: Dimensions;
          transform?: Transform;
          coordinateTransform?: CoordinateTransform;
        },
        _children,
        node: GoFishNode
      ) => {
        const space = coordinateTransform ?? linear();

        // const isDataX = isValue(dims[0].size);
        // const isDataY = isValue(dims[1].size);
        const isXEmbedded = intrinsicDims![0].embedded;
        const isYEmbedded = intrinsicDims![1].embedded;

        // combine intrinsicDims with transform
        const displayDims = [
          {
            min:
              (transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.min ?? 0),
            size: intrinsicDims?.[0]?.size ?? 0,
            center:
              (transform?.translate?.[0] ?? 0) +
              (intrinsicDims?.[0]?.center ?? 0),
            max:
              (transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.max ?? 0),
          },
          {
            min:
              (transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.min ?? 0),
            size: intrinsicDims?.[1]?.size ?? 0,
            center:
              (transform?.translate?.[1] ?? 0) +
              (intrinsicDims?.[1]?.center ?? 0),
            max:
              (transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.max ?? 0),
          },
        ];

        const scaleContext = node.getRenderSession().scaleContext;
        const unit = scaleContext?.unit;
        const unitColorScale = unit && "color" in unit ? unit.color : undefined;
        const originalFill = fill;
        fill = isValue(fill)
          ? unitColorScale
            ? (unitColorScale.get(getValue(fill)) ?? getValue(fill))
            : getValue(fill)
          : fill;

        stroke = isValue(stroke)
          ? unitColorScale
            ? (unitColorScale.get(getValue(stroke)) ?? getValue(stroke))
            : getValue(stroke)
          : stroke;

        const resolvedFill = fill as string | undefined;
        const resolvedStroke =
          (stroke as string | undefined) ?? resolvedFill ?? "black";

        const labelText =
          label && originalFill && isValue(originalFill)
            ? String(getValue(originalFill) ?? "")
            : undefined;

        // Both dimensions are aesthetic - render as transformed point
        if (!isXEmbedded && !isYEmbedded) {
          const center: [number, number] = [
            (displayDims[0].min ?? 0) + (displayDims[0].size ?? 0) / 2,
            (displayDims[1].min ?? 0) + (displayDims[1].size ?? 0) / 2,
          ];
          const [transformedX, transformedY] = space.transform(center);
          const width = displayDims[0].size ?? 0;
          const height = displayDims[1].size ?? 0;

          return (
            <>
              <rect
                transform={`scale(1, -1)`}
                x={transformedX - width / 2}
                y={-(transformedY - height / 2) - height}
                rx={rx}
                ry={ry}
                width={width}
                height={height}
                fill={resolvedFill}
                stroke={resolvedStroke}
                stroke-width={strokeWidth ?? 0}
                filter={filter}
              />
              {labelText && (
                <text
                  transform="scale(1, -1)"
                  x={transformedX}
                  y={-transformedY}
                  fill="white"
                  font-size="12px"
                  text-anchor="middle"
                  dominant-baseline="central"
                >
                  {labelText}
                </text>
              )}
            </>
          );
        }

        // One dimension is data - render as line
        if (isXEmbedded !== isYEmbedded) {
          const dataAxis = isXEmbedded ? 0 : 1;
          const aestheticAxis = isXEmbedded ? 1 : 0;
          const thickness = displayDims[aestheticAxis].size ?? 0;

          // Calculate midpoint of aesthetic axis
          const aestheticMid =
            (displayDims[aestheticAxis].min ?? 0) +
            (displayDims[aestheticAxis].size ?? 0) / 2;

          // For linear spaces, we can render a simple line
          if (space.type === "linear") {
            const baseX = isXEmbedded
              ? (displayDims[0].min ?? 0)
              : aestheticMid - thickness / 2;
            const baseY = isXEmbedded
              ? aestheticMid - thickness / 2
              : (displayDims[1].min ?? 0);
            const rawWidth = isXEmbedded
              ? (displayDims[0].max ?? 0) - (displayDims[0].min ?? 0)
              : thickness;
            const rawHeight = isXEmbedded
              ? thickness
              : (displayDims[1].max ?? 0) - (displayDims[1].min ?? 0);

            // Handle negative dimensions by using absolute values and adjusting positions
            const width = Math.abs(rawWidth);
            const height = Math.abs(rawHeight);
            const x = rawWidth < 0 ? baseX + rawWidth : baseX;
            const y = rawHeight < 0 ? baseY + rawHeight : baseY;

            const center: [number, number] = [x + width / 2, y + height / 2];
            const [transformedX, transformedY] = space.transform(center);

            return (
              <>
                <rect
                  transform={`scale(1, -1)`}
                  x={x}
                  y={-y - height}
                  rx={rx}
                  ry={ry}
                  width={width}
                  height={height}
                  fill={resolvedFill}
                  stroke={resolvedStroke}
                  stroke-width={strokeWidth ?? 0}
                  filter={filter}
                />
                {labelText && (
                  <text
                    transform="scale(1, -1)"
                    x={transformedX}
                    y={-transformedY}
                    fill="white"
                    font-size="12px"
                    text-anchor="middle"
                    dominant-baseline="central"
                  >
                    {labelText}
                  </text>
                )}
              </>
            );
          }

          // Create path along midline
          const linePath = path(
            [
              [
                isXEmbedded ? (displayDims[0].min ?? 0) : aestheticMid,
                isXEmbedded ? aestheticMid : (displayDims[1].min ?? 0),
              ],
              [
                isXEmbedded ? (displayDims[0].max ?? 0) : aestheticMid,
                isXEmbedded ? aestheticMid : (displayDims[1].max ?? 0),
              ],
            ],
            {}
          );

          // Transform path
          const transformed = transformPath(linePath, space, {
            resample: true,
          });

          // 0.5 removes weird white space at least for some charts
          return (
            <path
              d={pathToSVGPath(transformed)}
              stroke={resolvedStroke}
              stroke-width={thickness + 0.5}
              fill="none"
              filter={filter}
            />
          );
        }

        // Both dimensions are data - render as area

        // If we're in a linear space, render as a rect element
        if (space.type === "linear") {
          const baseX = displayDims[0].min ?? 0;
          const baseY = displayDims[1].min ?? 0;
          const rawWidth = (displayDims[0].max ?? 0) - baseX;
          const rawHeight = (displayDims[1].max ?? 0) - baseY;

          // Handle negative dimensions by using absolute values and adjusting positions
          const width = Math.abs(rawWidth);
          const height = Math.abs(rawHeight);
          const x = rawWidth < 0 ? baseX + rawWidth : baseX;
          const y = rawHeight < 0 ? baseY + rawHeight : baseY;

          const center: [number, number] = [x + width / 2, y + height / 2];
          const [transformedX, transformedY] = space.transform(center);

          return (
            <>
              <rect
                transform={`scale(1, -1)`}
                x={x}
                y={-y - height}
                rx={rx}
                ry={ry}
                width={width}
                height={height}
                stroke={resolvedStroke}
                stroke-width={strokeWidth ?? 0}
                fill={resolvedFill}
                filter={filter}
              />
              {labelText && (
                <text
                  transform="scale(1, -1)"
                  x={transformedX}
                  y={-transformedY}
                  fill="white"
                  font-size="12px"
                  text-anchor="middle"
                  dominant-baseline="central"
                >
                  {labelText}
                </text>
              )}
            </>
          );
        }

        const corners = path(
          [
            [displayDims[0].min ?? 0, displayDims[1].min ?? 0],
            [displayDims[0].max ?? 0, displayDims[1].min ?? 0],
            [displayDims[0].max ?? 0, displayDims[1].max ?? 0],
            [displayDims[0].min ?? 0, displayDims[1].max ?? 0],
          ],
          { closed: true }
        );

        // Transform path
        const transformed = transformPath(corners, space, { resample: true });

        return (
          <path
            d={pathToSVGPath(transformed)}
            fill={resolvedFill}
            stroke={resolvedStroke}
            stroke-width={strokeWidth ?? 0}
            filter={filter}
          />
        );
      },
    },
    []
  );
};

export const rect = createMark(Rect, {
  w: "size",
  h: "size",
  fill: "color",
  stroke: "color",
});
