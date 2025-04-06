import { GoFishNode } from "../_node";
import { Size, elaborateDims, FancyDims } from "../dims";
import { canUnifyDomains, Domain, unifyContinuousDomains } from "../domain";

export const layer = (
  childrenOrOptions: ({ transform?: { scale?: { x?: number; y?: number } }; box?: boolean } & FancyDims) | GoFishNode[],
  maybeChildren?: GoFishNode[]
) => {
  const options = Array.isArray(childrenOrOptions) ? {} : childrenOrOptions;
  const children = Array.isArray(childrenOrOptions) ? childrenOrOptions : maybeChildren || [];
  const dims = elaborateDims(options);

  return new GoFishNode(
    {
      type: options.box === true ? "box" : "layer",
      shared: [false, false],
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        // unify continuous domains of children for each direction

        const filteredXChildDomains = childPosDomains
          .map((childPosDomain) => childPosDomain[0])
          .filter((d) => d !== undefined);
        const filteredYChildDomains = childPosDomains
          .map((childPosDomain) => childPosDomain[1])
          .filter((d) => d !== undefined);

        return [
          filteredXChildDomains.length > 0 && canUnifyDomains(filteredXChildDomains)
            ? unifyContinuousDomains(filteredXChildDomains)
            : undefined,
          filteredYChildDomains.length > 0 && canUnifyDomains(filteredYChildDomains)
            ? unifyContinuousDomains(filteredYChildDomains)
            : undefined,
        ];
      },
      measure: (shared, size, children) => {
        const childMeasures = children.map((child) => child.measure(size));
        return (scaleFactors: Size) => {
          const childSizes = childMeasures.map((childMeasure) => childMeasure(scaleFactors));
          const maxWidth = Math.max(...childSizes.map((childSize) => childSize[0]));
          const maxHeight = Math.max(...childSizes.map((childSize) => childSize[1]));
          const scaleX = options.transform?.scale?.x ?? 1;
          const scaleY = options.transform?.scale?.y ?? 1;
          return [maxWidth * scaleX, maxHeight * scaleY];
        };
      },
      layout: (shared, size, scaleFactors, children, measurement, posScales) => {
        const childPlaceables = [];

        for (const child of children) {
          console.log("layer posScales", posScales);
          const childPlaceable = child.layout(size, scaleFactors, posScales);
          childPlaceable.place({ x: 0, y: 0 });
          childPlaceables.push(childPlaceable);
        }

        const maxWidth = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].max!));
        const maxHeight = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].max!));
        const scaleX = options.transform?.scale?.x ?? 1;
        const scaleY = options.transform?.scale?.y ?? 1;

        // Calculate translation based on elaborated dimensions
        const translateX = dims[0].min !== undefined ? dims[0].min : 0;
        const translateY = dims[1].min !== undefined ? dims[1].min : 0;

        return {
          intrinsicDims: { w: maxWidth * scaleX, h: maxHeight * scaleY },
          transform: { translate: [translateX, translateY], scale: [scaleX, scaleY] },
        };
      },
      render: ({ intrinsicDims, transform }, children) => {
        const scaleX = options.transform?.scale?.x ?? 1;
        const scaleY = options.transform?.scale?.y ?? 1;

        return (
          <g
            transform={`translate(${transform?.translate?.[0] ?? 0}, ${
              transform?.translate?.[1] ?? 0
            }) scale(${scaleX}, ${scaleY})`}
          >
            {children}
          </g>
        );
      },
    },
    children
  );
};
