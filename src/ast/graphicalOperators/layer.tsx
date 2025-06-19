import { GoFishNode } from "../_node";
import { Size, elaborateDims, FancyDims } from "../dims";
import { canUnifyDomains, Domain, unifyContinuousDomains, ContinuousDomain } from "../domain";

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
          .filter((d): d is ContinuousDomain => d !== undefined && d.type === "continuous");
        const filteredYChildDomains = childPosDomains
          .map((childPosDomain) => childPosDomain[1])
          .filter((d): d is ContinuousDomain => d !== undefined && d.type === "continuous");

        return [
          filteredXChildDomains.length > 0 && canUnifyDomains(filteredXChildDomains)
            ? unifyContinuousDomains(filteredXChildDomains)
            : undefined,
          filteredYChildDomains.length > 0 && canUnifyDomains(filteredYChildDomains)
            ? unifyContinuousDomains(filteredYChildDomains)
            : undefined,
        ];
      },
      inferSizeDomains: (shared, size, children) => {
        const childMeasures = children.map((child) => child.inferSizeDomains(size));
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
          const childPlaceable = child.layout(size, scaleFactors, posScales);
          childPlaceable.place({ x: 0, y: 0 });
          childPlaceables.push(childPlaceable);
        }

        // Calculate the bounding box of all children
        const minX = Math.min(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].min!));
        const maxX = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].max!));
        const minY = Math.min(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].min!));
        const maxY = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].max!));

        const scaleX = options.transform?.scale?.x ?? 1;
        const scaleY = options.transform?.scale?.y ?? 1;

        return {
          intrinsicDims: [
            {
              min: minX,
              size: maxX - minX,
              center: minX + (maxX - minX) / 2,
              max: maxX,
            },
            {
              min: minY,
              size: maxY - minY,
              center: minY + (maxY - minY) / 2,
              max: maxY,
            },
          ],
          transform: {
            translate: [
              dims[0].min !== undefined ? dims[0].min - minX : undefined,
              dims[1].min !== undefined ? dims[1].min - minY : undefined,
            ],
            scale: [scaleX, scaleY],
          },
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
