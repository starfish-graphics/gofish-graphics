import { color6, color6_old } from "../../color";
import { path, Path, pathToSVGPath, segment, subdividePath, transformPath } from "../../path";
import { GoFishNode } from "../_node";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { linear } from "../coordinateTransforms/linear";
import { getMeasure, getValue, inferEmbedded, isValue, MaybeValue, Value } from "../data";
import { Dimensions, elaborateDims, FancyDims, FancySize, Size, Transform } from "../dims";
import { aesthetic, continuous, Domain } from "../domain";
import { scaleContext } from "../gofish";

/* TODO: what should default embedding behavior be when all values are aesthetic? */
export const rect = ({
  key,
  name,
  fill = color6_old[0],
  stroke = fill,
  strokeWidth = 0,
  rx = 0,
  ry = 0,
  ...fancyDims
}: {
  key?: string;
  name?: string;
  fill?: MaybeValue<string>;
  stroke?: MaybeValue<string>;
  strokeWidth?: number;
  rx?: number;
  ry?: number;
} & FancyDims<MaybeValue<number>>) => {
  const dims = elaborateDims(fancyDims).map(inferEmbedded);
  return new GoFishNode(
    {
      name,
      key,
      type: "rect",
      color: fill,
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        return [
          isValue(dims[0].min)
            ? continuous({
                value: [getValue(dims[0].min)!, getValue(dims[0].min)!],
                measure: getMeasure(dims[0].min),
              })
            : undefined,
          isValue(dims[1].min)
            ? continuous({
                value: [getValue(dims[1].min)!, getValue(dims[1].min)!],
                measure: getMeasure(dims[1].min),
              })
            : undefined,
        ];
      },
      // inferDomains: () => {
      //   return [
      //     isValue(dims[0].size)
      //       ? continuous({
      //           value: [0, getValue(dims[0].size)],
      //           dataType: getDataType(dims[0].size),
      //         })
      //       : dims[0].size
      //       ? aesthetic(dims[0].size)
      //       : undefined,
      //     isValue(dims[1].size)
      //       ? continuous({
      //           value: [0, getValue(dims[1].size)],
      //           dataType: getDataType(dims[1].size),
      //         })
      //       : dims[1].size
      //       ? aesthetic(dims[1].size)
      //       : undefined,
      //   ];
      // },
      inferSizeDomains: (shared, size, children) => {
        return (scaleFactors: Size): FancySize => {
          return {
            w: isValue(dims[0].size) ? getValue(dims[0].size!) * scaleFactors[0] : dims[0].size ?? size[0],
            h: isValue(dims[1].size) ? getValue(dims[1].size!) * scaleFactors[1] : dims[1].size ?? size[1],
          };
        };
      },
      layout: (shared, size, scaleFactors, children, measurement, posScales) => {
        const w = isValue(dims[0].size) ? getValue(dims[0].size!) * scaleFactors[0]! : dims[0].size ?? size[0];
        const h = isValue(dims[1].size) ? getValue(dims[1].size!) * scaleFactors[1]! : dims[1].size ?? size[1];
        const x = isValue(dims[0].min) ? posScales[0]!(getValue(dims[0].min)!) : dims[0].min ?? undefined;
        const y = isValue(dims[1].min) ? posScales[1]!(getValue(dims[1].min)!) : dims[1].min ?? undefined;

        return {
          intrinsicDims: [
            {
              min: 0,
              size: w,
              center: w / 2,
              max: w,
              embedded: dims[0].embedded,
            },
            {
              min: 0,
              size: h,
              center: h / 2,
              max: h,
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
            min: (transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.min ?? 0),
            size: intrinsicDims?.[0]?.size ?? 0,
            center: (transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.center ?? 0),
            max: (transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.max ?? 0),
          },
          {
            min: (transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.min ?? 0),
            size: intrinsicDims?.[1]?.size ?? 0,
            center: (transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.center ?? 0),
            max: (transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.max ?? 0),
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
              x={transformedX - width / 2}
              y={transformedY - height / 2}
              rx={rx}
              ry={ry}
              width={width}
              height={height}
              fill={fill}
              stroke={stroke ?? fill ?? "black"}
              stroke-width={strokeWidth ?? 0}
            />
          );
        }

        // One dimension is data - render as line
        if (isXEmbedded !== isYEmbedded) {
          const dataAxis = isXEmbedded ? 0 : 1;
          const aestheticAxis = isXEmbedded ? 1 : 0;
          const thickness = displayDims[aestheticAxis].size ?? 0;

          // Calculate midpoint of aesthetic axis
          const aestheticMid = (displayDims[aestheticAxis].min ?? 0) + (displayDims[aestheticAxis].size ?? 0) / 2;

          // For linear spaces, we can render a simple line
          if (space.type === "linear") {
            const x = isXEmbedded ? displayDims[0].min ?? 0 : aestheticMid - thickness / 2;
            const y = isXEmbedded ? aestheticMid - thickness / 2 : displayDims[1].min ?? 0;
            const width = isXEmbedded ? (displayDims[0].max ?? 0) - (displayDims[0].min ?? 0) : thickness;
            const height = isXEmbedded ? thickness : (displayDims[1].max ?? 0) - (displayDims[1].min ?? 0);

            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                stroke={stroke ?? fill ?? "black"}
                stroke-width={strokeWidth ?? 0}
              />
            );
          }

          // Create path along midline
          const linePath = path(
            [
              [
                isXEmbedded ? displayDims[0].min ?? 0 : aestheticMid,
                isXEmbedded ? aestheticMid : displayDims[1].min ?? 0,
              ],
              [
                isXEmbedded ? displayDims[0].max ?? 0 : aestheticMid,
                isXEmbedded ? aestheticMid : displayDims[1].max ?? 0,
              ],
            ],
            { subdivision: 1000 }
          );

          // Subdivide and transform path
          const transformed = transformPath(linePath, space);

          // 0.5 removes weird white space at least for some charts
          return <path d={pathToSVGPath(transformed)} stroke={fill} stroke-width={thickness + 0.5} fill="none" />;
        }

        // Both dimensions are data - render as area

        // If we're in a linear space, render as a rect element
        if (space.type === "linear") {
          const x = displayDims[0].min ?? 0;
          const y = displayDims[1].min ?? 0;
          const width = (displayDims[0].max ?? 0) - x;
          const height = (displayDims[1].max ?? 0) - y;
          return <rect x={x} y={y} width={width} height={height} fill={fill} />;
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
          />
        );
      },
    },
    []
  );
};
