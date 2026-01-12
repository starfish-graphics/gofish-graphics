import * as Monotonic from "../../util/monotonic";
import { GoFishNode } from "../_node";
import { Size, elaborateDims, FancyDims } from "../dims";
import {
  UNDEFINED,
  POSITION,
  UnderlyingSpace,
  ORDINAL,
  isORDINAL,
} from "../underlyingSpace";
import * as Interval from "../../util/interval";
import { computeSize } from "../../util";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { coord } from "../coordinateTransforms/coord";
import { getLayerContext, resetLayerContext } from "./frame";
import { withGoFishSequential } from "../withGoFish";
import { GoFishAST } from "../_ast";

// Re-export layer context functions for backward compatibility
export { getLayerContext, resetLayerContext };

export const layer = withGoFishSequential(
  async (
    childrenOrOptions:
      | ({
          key?: string;
          coord?: CoordinateTransform;
          transform?: { scale?: { x?: number; y?: number } };
          box?: boolean;
        } & FancyDims)
      | GoFishAST[],
    maybeChildren?: GoFishAST[]
  ) => {
    const options = Array.isArray(childrenOrOptions) ? {} : childrenOrOptions;
    const children = Array.isArray(childrenOrOptions)
      ? childrenOrOptions
      : maybeChildren || [];

    // If coord is provided, delegate to coord transform (similar to frame but without transform/box)
    if (!Array.isArray(childrenOrOptions) && options.coord !== undefined) {
      const {
        coord: coordTransform,
        key,
        transform: _transform,
        box: _box,
        ...restDims
      } = options;
      return coord(
        {
          key,
          transform: coordTransform,
          ...restDims,
        },
        children.filter((c): c is GoFishNode => c instanceof GoFishNode)
      );
    }

    const dims = elaborateDims(options);

    return new GoFishNode(
      {
        type: options.box === true ? "box" : "layer",
        key: options.key,
        shared: [false, false],
        resolveUnderlyingSpace: (
          children: Size<UnderlyingSpace>[],
          _childNodes: GoFishAST[]
        ) => {
          let xSpace = UNDEFINED;
          const xChildrenPositionSpaces = children.filter(
            (
              child
            ): child is [
              (typeof child)[0] & { kind: "position" },
              (typeof child)[1],
            ] => child[0].kind === "position"
          );
          const xChildrenOrdinalSpaces = children.filter(
            (child) => child[0].kind === "ordinal"
          );

          if (
            xChildrenPositionSpaces.length > 0 &&
            xChildrenOrdinalSpaces.length === 0
          ) {
            const domain = Interval.unionAll(
              ...xChildrenPositionSpaces.map((child) => child[0].domain)
            );
            xSpace = POSITION(domain);
          } else if (xChildrenOrdinalSpaces.length > 0) {
            // Collect and merge domains from all child ordinal spaces
            const allKeys = new Set<string>();
            xChildrenOrdinalSpaces.forEach((child) => {
              const ordinalSpace = child[0];
              if (isORDINAL(ordinalSpace) && ordinalSpace.domain) {
                ordinalSpace.domain.forEach((key) => allKeys.add(key));
              }
            });
            xSpace = ORDINAL(Array.from(allKeys));
          }

          let ySpace = UNDEFINED;
          const yChildrenPositionSpaces = children.filter(
            (
              child
            ): child is [
              (typeof child)[0],
              (typeof child)[1] & { kind: "position" },
            ] => child[1].kind === "position"
          );
          const yChildrenOrdinalSpaces = children.filter(
            (child) => child[1].kind === "ordinal"
          );

          if (
            yChildrenPositionSpaces.length > 0 &&
            yChildrenOrdinalSpaces.length === 0
          ) {
            const domain = Interval.unionAll(
              ...yChildrenPositionSpaces.map((child) => child[1].domain)
            );
            ySpace = POSITION(domain);
          } else if (yChildrenOrdinalSpaces.length > 0) {
            // Collect and merge domains from all child ordinal spaces
            const allKeys = new Set<string>();
            yChildrenOrdinalSpaces.forEach((child) => {
              const ordinalSpace = child[1];
              if (isORDINAL(ordinalSpace) && ordinalSpace.domain) {
                ordinalSpace.domain.forEach((key) => allKeys.add(key));
              }
            });
            ySpace = ORDINAL(Array.from(allKeys));
          }

          return [xSpace, ySpace];
        },
        inferSizeDomains: (shared, children) => {
          const childMeasures = children.map((child) =>
            child.inferSizeDomains()
          );

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
          // Compute size using dims (w and h) before passing to children
          size = [
            computeSize(dims[0].size, scaleFactors?.[0]!, size[0]) ?? size[0],
            computeSize(dims[1].size, scaleFactors?.[1]!, size[1]) ?? size[1],
          ];

          const childPlaceables = [];

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
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

          const childYPositions = childPlaceables.map((cp, i) => ({
            index: i,
            min: cp.dims[1].min,
            max: cp.dims[1].max,
            center: cp.dims[1].center,
            size: cp.dims[1].size,
          }));

          const translateY =
            dims[1].min !== undefined ? dims[1].min - minY : undefined;

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
                translateY,
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
  }
);
