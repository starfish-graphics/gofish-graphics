import { GoFishNode } from "../_node";
import { Size, elaborateDims, FancyDims } from "../dims";
import { Domain } from "../domain";

export const position = (
  childrenOrOptions:
    | ({ key?: string; x?: number; y?: number })
    | GoFishNode[],
  maybeChildren?: GoFishNode[]
) => {
  const options = Array.isArray(childrenOrOptions) ? {} : childrenOrOptions;
  const children = Array.isArray(childrenOrOptions) ? childrenOrOptions : maybeChildren || [];
  return new GoFishNode(
    {
      type: "position",
      key: options.key,
      shared: [false, false],
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        // Position operator doesn't affect domains, just positioning
        return [undefined, undefined];
      },
      inferSizeDomains: (shared, size, children) => {
        // Delegate to the single child's size requirements
        if (children.length !== 1) {
          throw new Error("Position operator expects exactly one child");
        }
        const childMeasure = children[0].inferSizeDomains(size);
        return (scaleFactors: Size) => {
          return childMeasure(scaleFactors);
        };
      },
      layout: (shared, size, scaleFactors, children, measurement, posScales) => {
        if (children.length !== 1) {
          throw new Error("Position operator expects exactly one child");
        }

        const child = children[0];
        const childPlaceable = child.layout(size, scaleFactors, posScales);
        
        // Place child at origin first to get its dimensions
        childPlaceable.place({ x: 0, y: 0 });

        // Calculate the position offset based on the child's intrinsic dimensions
        const childWidth = childPlaceable.dims[0].size || 0;
        const childHeight = childPlaceable.dims[1].size || 0;
        
        // Position is relative to the child's center point (SwiftUI-like behavior)
        const offsetX = (options.x ?? 0) - childWidth / 2;
        const offsetY = (options.y ?? 0) - childHeight / 2;

        // Update child position
        childPlaceable.place({ x: offsetX, y: offsetY });

        return {
          intrinsicDims: [
            {
              min: childPlaceable.dims[0].min! + offsetX,
              size: childWidth,
              center: (options.x ?? 0),
              max: childPlaceable.dims[0].max! + offsetX,
            },
            {
              min: childPlaceable.dims[1].min! + offsetY,
              size: childHeight,
              center: (options.y ?? 0),
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