import { GoFishNode, Placeable } from "../_node";
import { getValue, isValue, MaybeValue } from "../data";
import { Dimensions, elaborateDims, FancyDims, Size } from "../dims";
import { createOperator } from "../withGoFish";
import { GoFishAST } from "../_ast";
import { Collection } from "lodash";
import * as Monotonic from "../../util/monotonic";
import {
  DIFFERENCE,
  POSITION,
  UNDEFINED,
  isDIFFERENCE,
  isPOSITION,
  isSIZE,
  UnderlyingSpace,
} from "../underlyingSpace";
import * as Interval from "../../util/interval";

const unwrapLodashArray = function <T>(value: T[] | Collection<T>): T[] {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as Collection<T>).value() as T[];
  }
  return value as T[];
};

type Alignment = "start" | "middle" | "end" | "baseline";

type ScatterProps = {
  name?: string;
  key?: string;
  x?: MaybeValue<number>[];
  y?: MaybeValue<number>[];
  /** Range form: position each child so it spans [xMin[i], xMax[i]] in data space. */
  xMin?: MaybeValue<number>[];
  xMax?: MaybeValue<number>[];
  yMin?: MaybeValue<number>[];
  yMax?: MaybeValue<number>[];
  alignment?: Alignment;
} & FancyDims<MaybeValue<number>>;

const alignmentToAnchor = {
  start: "min",
  middle: "center",
  end: "max",
  baseline: "baseline",
} as const;

function getCurrentAnchor(
  child: Placeable,
  axis: 0 | 1,
  anchor: "min" | "center" | "max" | "baseline"
) {
  const dims = child.dims[axis];
  const min = dims.min ?? 0;
  const size = dims.size ?? 0;
  const max = dims.max ?? min + size;
  const center = dims.center ?? min + size / 2;

  switch (anchor) {
    case "min":
      return min;
    case "center":
      return center;
    case "max":
      return max;
    case "baseline":
      return 0;
  }
}

function setAxisTranslation(
  child: Placeable,
  axis: 0 | 1,
  target: number,
  anchor: "min" | "center" | "max" | "baseline"
) {
  const node = child as GoFishNode;
  const delta = target - getCurrentAnchor(child, axis, anchor);
  node.transform!.translate![axis] =
    (node.transform!.translate![axis] ?? 0) + delta;
}

function resolveAlignSpace(
  spaces: UnderlyingSpace[],
  alignment: Alignment
): UnderlyingSpace {
  if (spaces.every((s) => isSIZE(s))) {
    const sizeValues = spaces.map((s) => (s as any).value as number);
    if (
      alignment === "start" ||
      alignment === "end" ||
      alignment === "baseline"
    ) {
      const intervals = sizeValues.map((v) => Interval.interval(0, v));
      return POSITION(Interval.unionAll(...intervals));
    }
    if (alignment === "middle") {
      return DIFFERENCE(Math.max(...sizeValues.map((v) => Math.abs(v))));
    }
  } else if (spaces.every((s) => isDIFFERENCE(s))) {
    return DIFFERENCE(
      Math.max(...spaces.map((s) => (s as any).width as number))
    );
  } else if (spaces.every((s) => isPOSITION(s))) {
    const domain = Interval.unionAll(
      ...spaces.map(
        (s) => (s as any).domain as ReturnType<typeof Interval.interval>
      )
    );
    if (alignment === "middle") {
      return DIFFERENCE(Interval.width(domain));
    }
    return POSITION(domain);
  }
  return UNDEFINED;
}

function resolvePositionSpace(
  values: MaybeValue<number>[] | undefined
): UnderlyingSpace {
  if (!values || values.length === 0) return UNDEFINED;
  if (!values.every((value) => isValue(value))) return UNDEFINED;
  const rawValues = values.map((value) => getValue(value)!);
  return POSITION(
    Interval.interval(Math.min(...rawValues), Math.max(...rawValues))
  );
}

export const scatter = createOperator(
  (options: ScatterProps, children: GoFishAST[] | Collection<GoFishAST>) => {
    const {
      name,
      key,
      x,
      y,
      xMin,
      xMax,
      yMin,
      yMax,
      alignment = "baseline",
      ...fancyDims
    } = options;
    children = unwrapLodashArray(children);
    const dims = elaborateDims(fancyDims);

    const hasX = x !== undefined || (xMin !== undefined && xMax !== undefined);
    const hasY = y !== undefined || (yMin !== undefined && yMax !== undefined);

    if (children.length === 0) {
      throw new Error("Scatter operator expects at least one child");
    }
    if (!hasX && !hasY) {
      throw new Error("Scatter operator requires at least one of x or y");
    }
    if (x !== undefined && x.length !== children.length) {
      throw new Error("Scatter operator x array must match children length");
    }
    if (y !== undefined && y.length !== children.length) {
      throw new Error("Scatter operator y array must match children length");
    }
    if (xMin !== undefined && xMin.length !== children.length) {
      throw new Error("Scatter operator xMin array must match children length");
    }
    if (xMax !== undefined && xMax.length !== children.length) {
      throw new Error("Scatter operator xMax array must match children length");
    }

    return new GoFishNode(
      {
        type: "scatter",
        key,
        name,
        args: { key, name, x, y, xMin, xMax, yMin, yMax, alignment, dims },
        shared: [false, false],
        resolveUnderlyingSpace: (
          childSpaces: Size<UnderlyingSpace>[],
          _childNodes: GoFishAST[]
        ) => {
          const xSpace =
            x !== undefined
              ? resolvePositionSpace(x)
              : xMin !== undefined && xMax !== undefined
                ? POSITION(
                    Interval.interval(
                      Math.min(...xMin.map((v) => getValue(v)!)),
                      Math.max(...xMax.map((v) => getValue(v)!))
                    )
                  )
                : resolveAlignSpace(
                    childSpaces.map((child) => child[0]),
                    alignment
                  );
          const ySpace =
            y !== undefined
              ? resolvePositionSpace(y)
              : yMin !== undefined && yMax !== undefined
                ? POSITION(
                    Interval.interval(
                      Math.min(...yMin.map((v) => getValue(v)!)),
                      Math.max(...yMax.map((v) => getValue(v)!))
                    )
                  )
                : resolveAlignSpace(
                    childSpaces.map((child) => child[1]),
                    alignment
                  );
          return [xSpace, ySpace];
        },
        inferSizeDomains: (_shared, childNodes) => {
          const childDomains = childNodes.map((child) =>
            child.inferSizeDomains()
          );
          return {
            w: Monotonic.max(...childDomains.map((domain) => domain[0])),
            h: Monotonic.max(...childDomains.map((domain) => domain[1])),
          };
        },
        layout: (
          _shared,
          size,
          scaleFactors,
          childNodes,
          _measurement,
          posScales
        ) => {
          const childPlaceables = childNodes.map((child) =>
            child.layout(size, scaleFactors, posScales)
          );
          const anchorKey = {
            start: "min",
            middle: "center",
            end: "max",
            baseline: "min",
          } as const;
          const isFixed = (axis: 0 | 1, child: Placeable) =>
            child.dims[axis].min !== undefined;
          const getBaseline = (axis: 0 | 1, child: Placeable) =>
            child.dims[axis][anchorKey[alignment]]!;

          childPlaceables.forEach((child) => {
            child.place("x", 0);
            child.place("y", 0);
          });

          childPlaceables.forEach((child, index) => {
            const xPos = x?.[index];
            const yPos = y?.[index];

            if (xMin !== undefined && xMax !== undefined) {
              // Range mode: stretch child to span [xMin, xMax] in data space
              const node = child as GoFishNode;
              const xMinPx = posScales[0]!(getValue(xMin[index])!);
              const xMaxPx = posScales[0]!(getValue(xMax[index])!);
              const width = xMaxPx - xMinPx;
              node.transform!.translate![0] = xMinPx;
              node.intrinsicDims![0] = {
                ...(node.intrinsicDims![0] ?? {}),
                min: 0,
                size: width,
                center: width / 2,
                max: width,
              } as Dimensions[0];
            } else if (xPos !== undefined) {
              const resolvedX = isValue(xPos)
                ? posScales[0]!(getValue(xPos)!)
                : xPos;
              setAxisTranslation(child, 0, resolvedX, "center");
            }

            if (yMin !== undefined && yMax !== undefined) {
              // Range mode: stretch child to span [yMin, yMax] in data space
              const node = child as GoFishNode;
              const yMinPx = posScales[1]!(getValue(yMin[index])!);
              const yMaxPx = posScales[1]!(getValue(yMax[index])!);
              const height = yMaxPx - yMinPx;
              node.transform!.translate![1] = yMinPx;
              node.intrinsicDims![1] = {
                ...(node.intrinsicDims![1] ?? {}),
                min: 0,
                size: height,
                center: height / 2,
                max: height,
              } as Dimensions[1];
            } else if (yPos !== undefined) {
              const resolvedY = isValue(yPos)
                ? posScales[1]!(getValue(yPos)!)
                : yPos;
              setAxisTranslation(child, 1, resolvedY, "center");
            }
          });

          ([0, 1] as const).forEach((axis) => {
            const positions = axis === 0 ? x : y;
            const isRangeAxis =
              axis === 0
                ? xMin !== undefined && xMax !== undefined
                : yMin !== undefined && yMax !== undefined;
            if (positions !== undefined || isRangeAxis) return;

            const fixedChildren = childPlaceables.filter((child) =>
              isFixed(axis, child)
            );
            const baseline =
              fixedChildren.length > 0
                ? getBaseline(axis, fixedChildren[0])
                : alignment === "middle"
                  ? size[axis] / 2
                  : posScales?.[axis]
                    ? posScales[axis](0)
                    : 0;

            childPlaceables.forEach((child) => {
              if (isFixed(axis, child)) return;
              setAxisTranslation(
                child,
                axis,
                baseline,
                alignmentToAnchor[alignment]
              );
            });
          });

          const minX = Math.min(
            ...childPlaceables.map((child) => child.dims[0].min!)
          );
          const maxX = Math.max(
            ...childPlaceables.map((child) => child.dims[0].max!)
          );
          const minY = Math.min(
            ...childPlaceables.map((child) => child.dims[1].min!)
          );
          const maxY = Math.max(
            ...childPlaceables.map((child) => child.dims[1].max!)
          );

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
            transform: { translate: [0, 0] },
          };
        },
        render: (_props, children) => {
          return <g>{children}</g>;
        },
      },
      children
    );
  }
);
