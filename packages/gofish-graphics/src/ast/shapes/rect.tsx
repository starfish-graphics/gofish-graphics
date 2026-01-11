import { color6, color6_old } from "../../color";
import {
  path,
  Path,
  pathToSVGPath,
  segment,
  subdividePath,
  transformPath,
} from "../../path";
import { GoFishNode } from "../_node";
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
import { scaleContext } from "../gofish";
import * as Monotonic from "../../util/monotonic";
import { computeAesthetic, computeSize } from "../../util";
import { DIFFERENCE, ORDINAL, POSITION, UNDEFINED } from "../underlyingSpace";
import { interval } from "../../util/interval";

const computeIntrinsicSize = (
  input: MaybeValue<number> | undefined
): Monotonic.Monotonic => {
  return isValue(input)
    ? Monotonic.linear(getValue(input)!, 0)
    : Monotonic.linear(0, input ?? 0);
};

/* TODO: what should default embedding behavior be when all values are aesthetic? */
export const rect = ({
  key,
  name,
  fill = color6[0],
  stroke = fill,
  strokeWidth = 0,
  rx = 0,
  ry = 0,
  filter,
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
        dims,
      },
      color: fill,
      resolveUnderlyingSpace: () => {
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
          underlyingSpaceX = ORDINAL;
        } else if (isAesthetic(dims[0].min) && isValue(dims[0].size)) {
          // the best we can do is difference
          underlyingSpaceX = DIFFERENCE(getValue(dims[0].size)!);
        } else {
          const min = isValue(dims[0].min) ? getValue(dims[0].min) : 0;
          const size = isValue(dims[0].size) ? getValue(dims[0].size) : 0;
          const domain = interval(min, min + size);
          underlyingSpaceX = POSITION(domain);
        }

        let underlyingSpaceY = UNDEFINED;
        if (!isValue(dims[1].min) && !isValue(dims[1].size)) {
          // nothing is data-driven
          underlyingSpaceY = ORDINAL;
        } else if (isAesthetic(dims[1].min) && isValue(dims[1].size)) {
          // the best we can do is difference
          underlyingSpaceY = DIFFERENCE(getValue(dims[1].size)!);
        } else {
          const min = isValue(dims[1].min) ? getValue(dims[1].min) : 0;
          const size = isValue(dims[1].size) ? getValue(dims[1].size) : 0;
          const domain = interval(min, min + size);
          underlyingSpaceY = POSITION(domain);
        }

        // const w = computeIntrinsicSize(dims[0].size);
        // const h = computeIntrinsicSize(dims[1].size);

        return [underlyingSpaceX, underlyingSpaceY];
      },
      inferSizeDomains: (shared, children) => {
        return {
          w: computeIntrinsicSize(dims[0].size),
          h: computeIntrinsicSize(dims[1].size),
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
        const x = computeAesthetic(dims[0].min, posScales?.[0]!, undefined);
        const y = computeAesthetic(dims[1].min, posScales?.[1]!, undefined);

        let w: number;
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

        let h: number;
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

        return {
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
      },
      render: ({
        intrinsicDims,
        transform,
        coordinateTransform,
      }: {
        intrinsicDims?: Dimensions;
        transform?: Transform;
        coordinateTransform?: CoordinateTransform;
      }) => {
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

        fill = isValue(fill)
          ? scaleContext?.unit?.color
            ? scaleContext.unit.color.get(getValue(fill))
            : getValue(fill)
          : fill;

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
            <rect
              transform={`scale(1, -1)`}
              x={transformedX - width / 2}
              y={-(transformedY - height / 2) - height}
              rx={rx}
              ry={ry}
              width={width}
              height={height}
              fill={fill}
              stroke={stroke ?? fill ?? "black"}
              stroke-width={strokeWidth ?? 0}
              filter={filter}
            />
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

            return (
              <rect
                transform={`scale(1, -1)`}
                x={x}
                y={-y - height}
                width={width}
                height={height}
                fill={fill}
                stroke={stroke ?? fill ?? "black"}
                stroke-width={strokeWidth ?? 0}
                filter={filter}
              />
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
            { subdivision: 1000 }
          );

          // Subdivide and transform path
          const transformed = transformPath(linePath, space);

          // 0.5 removes weird white space at least for some charts
          return (
            <path
              d={pathToSVGPath(transformed)}
              stroke={fill}
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

          return (
            <rect
              transform={`scale(1, -1)`}
              x={x}
              y={-y - height}
              width={width}
              height={height}
              fill={fill}
            />
          );
        }

        const corners = path(
          [
            [displayDims[0].min ?? 0, displayDims[1].min ?? 0],
            [displayDims[0].max ?? 0, displayDims[1].min ?? 0],
            [displayDims[0].max ?? 0, displayDims[1].max ?? 0],
            [displayDims[0].min ?? 0, displayDims[1].max ?? 0],
          ],
          { closed: true, subdivision: 1000 }
        );

        const transformed = transformPath(corners, space);

        return (
          <path
            d={pathToSVGPath(transformed)}
            fill={fill}
            stroke={stroke ?? fill ?? "black"}
            stroke-width={strokeWidth ?? 0}
            filter={filter}
          />
        );
      },
    },
    []
  );
};
