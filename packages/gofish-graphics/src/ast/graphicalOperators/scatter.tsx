import { GoFishNode, Placeable } from "../_node";
import { getValue, isValue, MaybeValue } from "../data";
import { elaborateDims, FancyDims, Size } from "../dims";
import { createOperator } from "../withGoFish";
import { GoFishAST } from "../_ast";
import _, { Collection } from "lodash";
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
  alignment?: Alignment;
} & FancyDims<MaybeValue<number>>;

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
    const { name, key, x, y, alignment = "baseline", ...fancyDims } = options;
    children = unwrapLodashArray(children);
    const dims = elaborateDims(fancyDims);

    if (children.length === 0) {
      throw new Error("Scatter operator expects at least one child");
    }
    if (x === undefined && y === undefined) {
      throw new Error("Scatter operator requires at least one of x or y");
    }
    if (x !== undefined && x.length !== children.length) {
      throw new Error("Scatter operator x array must match children length");
    }
    if (y !== undefined && y.length !== children.length) {
      throw new Error("Scatter operator y array must match children length");
    }

    return new GoFishNode(
      {
        type: "scatter",
        key,
        name,
        args: { key, name, x, y, alignment, dims },
        shared: [false, false],
        resolveUnderlyingSpace: (
          childSpaces: Size<UnderlyingSpace>[],
          _childNodes: GoFishAST[]
        ) => {
          return [
            x !== undefined
              ? resolvePositionSpace(x)
              : resolveAlignSpace(
                  childSpaces.map((child) => child[0]),
                  alignment
                ),
            y !== undefined
              ? resolvePositionSpace(y)
              : resolveAlignSpace(
                  childSpaces.map((child) => child[1]),
                  alignment
                ),
          ];
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

          const alignmentToAnchor = {
            start: "min",
            middle: "center",
            end: "max",
            baseline: "baseline",
          } as const;
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

          childPlaceables.forEach((child, index) => {
            const xPos = x?.[index];
            const yPos = y?.[index];

            if (xPos !== undefined) {
              child.place(
                "x",
                isValue(xPos) ? posScales[0]!(getValue(xPos)!) : xPos,
                "center"
              );
            }
            if (yPos !== undefined) {
              child.place(
                "y",
                isValue(yPos) ? posScales[1]!(getValue(yPos)!) : yPos,
                "center"
              );
            }
          });

          ([0, 1] as const).forEach((axis) => {
            const positions = axis === 0 ? x : y;
            if (positions !== undefined) return;

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
              child.place(axis, baseline, alignmentToAnchor[alignment]);
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
