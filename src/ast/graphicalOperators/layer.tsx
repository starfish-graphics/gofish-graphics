import * as Monotonic from "../../util/monotonic";
import { GoFishNode } from "../_node";
import { Size, elaborateDims, FancyDims } from "../dims";
import {
  canUnifyDomains,
  Domain,
  unifyContinuousDomains,
  ContinuousDomain,
} from "../domain";
import {
  UNDEFINED,
  POSITION,
  UnderlyingSpace,
  ORDINAL,
} from "../underlyingSpace";
import * as Interval from "../../util/interval";

export const layer = (
  childrenOrOptions:
    | ({
        key?: string;
        transform?: { scale?: { x?: number; y?: number } };
        box?: boolean;
      } & FancyDims)
    | GoFishNode[],
  maybeChildren?: GoFishNode[]
) => {
  const options = Array.isArray(childrenOrOptions) ? {} : childrenOrOptions;
  const children = Array.isArray(childrenOrOptions)
    ? childrenOrOptions
    : maybeChildren || [];
  const dims = elaborateDims(options);

  return new GoFishNode(
    {
      type: options.box === true ? "box" : "layer",
      key: options.key,
      shared: [false, false],
      resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
        let xSpace = UNDEFINED;
        const xChildrenPositionSpaces = children.filter(
          (child) => child[0].kind === "position"
        );
        const xChildrenOrdinalSpaces = children.filter(
          (child) => child[0].kind === "ordinal"
        );

        if (
          xChildrenPositionSpaces.length > 0 &&
          xChildrenOrdinalSpaces.length === 0
        ) {
          const domain = Interval.unionAll(
            ...xChildrenPositionSpaces.map((child) => child[0].domain!)
          );
          xSpace = POSITION([domain.min, domain.max]);
        } else if (xChildrenOrdinalSpaces.length > 0) {
          xSpace = ORDINAL;
        }

        let ySpace = UNDEFINED;
        const yChildrenPositionSpaces = children.filter(
          (child) => child[1].kind === "position"
        );
        const yChildrenOrdinalSpaces = children.filter(
          (child) => child[1].kind === "ordinal"
        );

        if (
          yChildrenPositionSpaces.length > 0 &&
          yChildrenOrdinalSpaces.length === 0
        ) {
          const domain = Interval.unionAll(
            ...yChildrenPositionSpaces.map((child) => child[1].domain!)
          );
          ySpace = POSITION([domain.min, domain.max]);
        } else if (yChildrenOrdinalSpaces.length > 0) {
          ySpace = ORDINAL;
        }

        return [xSpace, ySpace];
      },
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        // unify continuous domains of children for each direction

        const filteredXChildDomains = childPosDomains
          .map((childPosDomain) => childPosDomain[0])
          .filter(
            (d): d is ContinuousDomain =>
              d !== undefined && d.type === "continuous"
          );
        const filteredYChildDomains = childPosDomains
          .map((childPosDomain) => childPosDomain[1])
          .filter(
            (d): d is ContinuousDomain =>
              d !== undefined && d.type === "continuous"
          );

        const result = [
          filteredXChildDomains.length > 0 &&
          canUnifyDomains(filteredXChildDomains)
            ? unifyContinuousDomains(filteredXChildDomains)
            : undefined,
          filteredYChildDomains.length > 0 &&
          canUnifyDomains(filteredYChildDomains)
            ? unifyContinuousDomains(filteredYChildDomains)
            : undefined,
        ];
        // console.log("layer.inferPosDomains", {
        //   filteredXChildDomains,
        //   filteredYChildDomains,
        //   result,
        // });
        return result;
      },
      inferSizeDomains: (shared, children) => {
        const childMeasures = children.map((child) => child.inferSizeDomains());

        const childMeasuresWidth = childMeasures.map((cm) => cm[0]);
        const childMeasuresHeight = childMeasures.map((cm) => cm[1]);

        return {
          w: Monotonic.smul(
            options.transform?.scale?.x ?? 1,
            Monotonic.max(...childMeasuresWidth)
          ),
          h: Monotonic.smul(
            options.transform?.scale?.y ?? 1,
            Monotonic.max(...childMeasuresHeight)
          ),
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
        const childPlaceables = [];

        for (const child of children) {
          const childPlaceable = child.layout(size, scaleFactors, posScales);
          childPlaceable.place({ x: 0, y: 0 });
          childPlaceables.push(childPlaceable);
        }

        // Calculate the bounding box of all children
        const minX = Math.min(
          ...childPlaceables.map(
            (childPlaceable) => childPlaceable.dims[0].min!
          )
        );
        const maxX = Math.max(
          ...childPlaceables.map(
            (childPlaceable) => childPlaceable.dims[0].max!
          )
        );
        const minY = Math.min(
          ...childPlaceables.map(
            (childPlaceable) => childPlaceable.dims[1].min!
          )
        );
        const maxY = Math.max(
          ...childPlaceables.map(
            (childPlaceable) => childPlaceable.dims[1].max!
          )
        );

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
