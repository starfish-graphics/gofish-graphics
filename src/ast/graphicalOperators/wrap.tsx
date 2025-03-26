import * as BubbleSets from "bubblesets-js";
import { GoFishNode } from "../_node";
import { Size } from "../dims";
import { GoFishAST } from "../_ast";

export const wrap = (children: GoFishAST[]) => {
  return new GoFishNode(
    {
      type: "wrap",
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
        const childPlaceables = [];

        for (const child of children) {
          const childPlaceable = child.layout(size, scaleFactors);
          // childPlaceable.place({ x: 0, y: 0 });
          childPlaceables.push(childPlaceable);
        }

        const bubbleSets = new BubbleSets.BubbleSets();
        for (const childPlaceable of childPlaceables) {
          bubbleSets.pushMember(
            BubbleSets.rect(
              childPlaceable.dims[0].min!,
              childPlaceable.dims[1].min!,
              childPlaceable.dims[0].size!,
              childPlaceable.dims[1].size!
            )
          );
        }
        const pointPath = bubbleSets.compute();
        const cleanPath = pointPath.sample(4).simplify(0).bSplines().simplify(0);

        const maxWidth = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].max!));
        const maxHeight = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].max!));
        return {
          intrinsicDims: { w: maxWidth, h: maxHeight },
          transform: { translate: [0, 0] },
          renderData: {
            path: cleanPath,
          },
        };
      },
      render: ({ intrinsicDims, transform, renderData }, children) => {
        return (
          <g transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}>
            <path d={renderData?.path?.toString()} fill="none" stroke="black" stroke-width={1} />
            {children}
          </g>
        );
      },
    },
    children
  );
};
