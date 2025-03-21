import { GoFishNode } from "./_node";
import { Size } from "./dims";

export const layer = (children: GoFishNode[]) => {
  return new GoFishNode(
    {
      type: "layer",
      shared: [false, false],
      measure: (shared, size, children) => {
        const childMeasures = children.map((child) => child.measure(size));
        return (scaleFactors: Size) => {
          const childSizes = childMeasures.map((childMeasure) => childMeasure(scaleFactors));
          const maxWidth = Math.max(...childSizes.map((childSize) => childSize[0]));
          const maxHeight = Math.max(...childSizes.map((childSize) => childSize[1]));
          return [maxWidth, maxHeight];
        };
      },
      layout: (shared, size, scaleFactors, children) => {
        const childPlaceables = children.map((child) => child.layout(size, scaleFactors));

        for (const childPlaceable of childPlaceables) {
          childPlaceable.place({ x: 0, y: 0 });
        }

        const maxWidth = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].max!));
        const maxHeight = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].max!));
        return {
          intrinsicDims: { w: maxWidth, h: maxHeight },
          transform: { translate: [0, 0] },
        };
      },
      render: ({ intrinsicDims, transform }, children) => {
        return (
          <g transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}>
            {children}
          </g>
        );
      },
    },
    children
  );
};
