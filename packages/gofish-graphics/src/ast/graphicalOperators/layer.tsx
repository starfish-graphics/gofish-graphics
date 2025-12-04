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
import { computeSize } from "../../util";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { coord } from "../coordinateTransforms/coord";
import { getLayerContext, resetLayerContext } from "./frame";
import { withGoFish } from "../withGoFish";
import { GoFishAST } from "../_ast";
import _, { ListOfRecursiveArraysOrValues } from "lodash";

// Re-export layer context functions for backward compatibility
export { getLayerContext, resetLayerContext };

/**
 * Sequentially await all promises in a nested structure (instead of parallel like Promise.all)
 * This ensures that children with .as() calls complete before dependent children try to resolve selectors
 */
async function awaitAllPromisesSequential<T>(
  value:
    | T
    | Promise<T>
    | ListOfRecursiveArraysOrValues<T | Promise<T>>
    | null
    | undefined
): Promise<ListOfRecursiveArraysOrValues<T>> {
  if (value === null || value === undefined) {
    return [] as ListOfRecursiveArraysOrValues<T>;
  }

  // If it's a promise, await it first
  if (value instanceof Promise) {
    const resolved = await value;
    return awaitAllPromisesSequential(resolved);
  }

  // If it's an array, recursively await all elements sequentially
  if (Array.isArray(value)) {
    const awaited: any[] = [];
    for (const item of value) {
      awaited.push(await awaitAllPromisesSequential(item));
    }
    return _.flattenDeep(awaited) as ListOfRecursiveArraysOrValues<T>;
  }

  // Otherwise, return as-is
  return value as ListOfRecursiveArraysOrValues<T>;
}

// Custom layer wrapper that processes children sequentially
function withLayerSequential<T extends Record<string, any>, R>(
  func: (opts: T, children: GoFishAST[]) => R
): {
  (
    opts?: T,
    children?:
      | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
      | null
  ): Promise<R>;
  (
    children:
      | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
      | null
  ): Promise<R>;
} {
  return async function (...args: any[]): Promise<R> {
    let opts: T;
    let children:
      | ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>
      | Promise<ListOfRecursiveArraysOrValues<GoFishAST | Promise<GoFishAST>>>
      | null
      | undefined;
    if (args.length === 2) {
      opts = args[0] ?? ({} as T);
      children = args[1];
    } else if (args.length === 1) {
      opts = {} as T;
      children = args[0];
    } else if (args.length === 0) {
      opts = {} as T;
      children = undefined;
    } else {
      throw new Error(
        `withLayerSequential: Expected 0, 1, or 2 arguments, got ${args.length}`
      );
    }
    // Await all promises sequentially, then flatten deeply nested children
    const awaitedChildren = await awaitAllPromisesSequential(children);
    const flattened = _.flattenDeep(awaitedChildren) as any[];
    const flatChildren = flattened.filter(
      (child): child is GoFishAST => child != null
    );
    return func(opts, flatChildren);
  };
}

export const layer = withLayerSequential(
  (
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
        children
      );
    }

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
  }
);
