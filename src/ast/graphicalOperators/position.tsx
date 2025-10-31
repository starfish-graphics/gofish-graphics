import { GoFishNode } from "../_node";
import { Size, elaborateDims, FancyDims } from "../dims";
import { Domain, continuous } from "../domain";
import { getMeasure, getValue, isValue, MaybeValue } from "../data";
import { POSITION, UNDEFINED, UnderlyingSpace } from "../underlyingSpace";

export const position = (
  childrenOrOptions:
    | { key?: string; x?: MaybeValue<number>; y?: MaybeValue<number> }
    | GoFishNode[],
  maybeChildren?: GoFishNode[]
) => {
  const options = Array.isArray(childrenOrOptions) ? {} : childrenOrOptions;
  const children = Array.isArray(childrenOrOptions)
    ? childrenOrOptions
    : maybeChildren || [];
  return new GoFishNode(
    {
      type: "position",
      key: options.key,
      shared: [false, false],
      resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
        return [
          isValue(options.x)
            ? POSITION([getValue(options.x)!, getValue(options.x)!])
            : UNDEFINED,
          isValue(options.y)
            ? POSITION([getValue(options.y)!, getValue(options.y)!])
            : UNDEFINED,
        ];
      },
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        return [
          isValue(options.x)
            ? continuous({
                value: [getValue(options.x)!, getValue(options.x)!],
                measure: getMeasure(options.x),
              })
            : undefined,
          isValue(options.y)
            ? continuous({
                value: [getValue(options.y)!, getValue(options.y)!],
                measure: getMeasure(options.y),
              })
            : undefined,
        ];
      },
      inferSizeDomains: (shared, children) => {
        // Delegate to the single child's size requirements
        if (children.length !== 1) {
          throw new Error("Position operator expects exactly one child");
        }
        const childMeasure = children[0].inferSizeDomains();
        return {
          w: childMeasure[0],
          h: childMeasure[1],
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
        if (children.length !== 1) {
          throw new Error("Position operator expects exactly one child");
        }

        const child = children[0];
        /* TODO: maybe pass like [10, 10] to this instead of size to do a default think for
        scattering... but scatter pie is still broken... */
        const childPlaceable = child.layout(size, scaleFactors, posScales);

        // Place child at origin first to get its dimensions
        childPlaceable.place({ x: 0, y: 0 });

        // Calculate the position offset based on the child's intrinsic dimensions
        const childWidth = childPlaceable.dims[0].size || 0;
        const childHeight = childPlaceable.dims[1].size || 0;

        // Handle x and y values (can be literal values or data-bound values)
        const xPos = options.x
          ? isValue(options.x)
            ? posScales[0]!(getValue(options.x)!)
            : options.x
          : 0;
        const yPos = options.y
          ? isValue(options.y)
            ? posScales[1]!(getValue(options.y)!)
            : options.y
          : 0;

        // Position is relative to the child's center point (SwiftUI-like behavior)
        const offsetX = xPos - childWidth / 2;
        const offsetY = yPos - childHeight / 2;

        // Update child position
        childPlaceable.place({ x: offsetX, y: offsetY });

        return {
          intrinsicDims: [
            {
              min: childPlaceable.dims[0].min! + offsetX,
              size: childWidth,
              center: xPos,
              max: childPlaceable.dims[0].max! + offsetX,
            },
            {
              min: childPlaceable.dims[1].min! + offsetY,
              size: childHeight,
              center: yPos,
              max: childPlaceable.dims[1].max! + offsetY,
            },
          ],
          transform: {
            translate: [offsetX, offsetY],
          },
        };
      },
      render: ({ intrinsicDims, transform }, children) => {
        return (
          <g
            transform={`translate(${transform?.translate?.[0] ?? 0}, ${
              transform?.translate?.[1] ?? 0
            })`}
          >
            {children}
          </g>
        );
      },
    },
    children
  );
};
