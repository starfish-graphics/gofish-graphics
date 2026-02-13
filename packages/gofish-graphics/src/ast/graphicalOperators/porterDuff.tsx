import type { JSX } from "solid-js";
import * as Monotonic from "../../util/monotonic";
import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import type { Placeable } from "../_node";
import { Size } from "../dims";
import { UNDEFINED, UnderlyingSpace } from "../underlyingSpace";
import { createOperator } from "../withGoFish";

type BlendMode = "color" | "multiply" | "screen" | "overlay";
type CompositeOperator = "over" | "in" | "xor" | "out" | "atop";

const requireTwoChildren = <T,>(children: T[]) => {
  if (children.length !== 2) {
    throw new Error("Porter-Duff relation operators currently expect exactly two children");
  }
};

const maxChildBounds = (children: Placeable[]) => {
  const minX = Math.min(...children.map((child) => child.dims[0].min ?? 0));
  const maxX = Math.max(...children.map((child) => child.dims[0].max ?? 0));
  const minY = Math.min(...children.map((child) => child.dims[1].min ?? 0));
  const maxY = Math.max(...children.map((child) => child.dims[1].max ?? 0));
  return { minX, maxX, minY, maxY };
};

const renderComposite = (
  node: GoFishNode,
  children: JSX.Element[],
  intrinsicDims: GoFishNode["intrinsicDims"],
  operator: CompositeOperator,
  blendMode: BlendMode
) => {
  const uid = `pd-${node.uid}`;
  const sourceId = `${uid}-source`;
  const destinationId = `${uid}-destination`;
  const filterId = `${uid}-filter`;

  const minX = intrinsicDims?.[0]?.min ?? 0;
  const minY = intrinsicDims?.[1]?.min ?? 0;
  const width = intrinsicDims?.[0]?.size ?? 0;
  const height = intrinsicDims?.[1]?.size ?? 0;

  const tail =
    operator === "in"
      ? (
        <>
          <feBlend
            in="compositeResult"
            in2="graySource"
            mode={blendMode}
            result="blendedIntersect"
          />
          <feComposite
            in="blendedIntersect"
            in2="compositeResult"
            operator="in"
          />
        </>
      )
      : operator === "over" || operator === "atop"
        ? <feBlend in="compositeResult" in2="graySource" mode={blendMode} />
        : null;

  return (
    <>
      <defs>
        <g id={sourceId}>{children[0]}</g>
        <g id={destinationId}>{children[1]}</g>
        <filter
          id={filterId}
          x={minX}
          y={minY}
          width={width}
          height={height}
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feImage href={`#${sourceId}`} result="sourceImage" />
          <feColorMatrix
            in="sourceImage"
            type="saturate"
            values="0"
            result="graySource"
          />
          <feImage href={`#${destinationId}`} result="destination" />
          <feComposite
            in="destination"
            in2="graySource"
            operator={operator}
            result="compositeResult"
          />
          {tail}
        </filter>
      </defs>
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="transparent"
        filter={`url(#${filterId})`}
      />
    </>
  );
};

const createCompositeRelation = (
  type: string,
  operator: CompositeOperator
) =>
  createOperator(
    (
      {
        blendMode = "color",
      }: {
        blendMode?: BlendMode;
      },
      children: GoFishAST[]
    ) => {
      requireTwoChildren(children);

      return new GoFishNode(
        {
          type,
          shared: [false, false],
          resolveUnderlyingSpace: (
            _children: Size<UnderlyingSpace>[],
            _childNodes: GoFishAST[]
          ) => [UNDEFINED, UNDEFINED],
          inferSizeDomains: (_shared, layoutChildren) => {
            requireTwoChildren(layoutChildren);
            const childMeasures = layoutChildren.map((child) =>
              child.inferSizeDomains()
            );
            return {
              w: Monotonic.max(...childMeasures.map((measure) => measure[0])),
              h: Monotonic.max(...childMeasures.map((measure) => measure[1])),
            };
          },
          layout: (_shared, size, scaleFactors, layoutChildren, _measurement, posScales) => {
            requireTwoChildren(layoutChildren);

            const childPlaceables = layoutChildren.map((child) =>
              child.layout(size, scaleFactors, posScales)
            );
            childPlaceables.forEach((child) => child.place({ x: 0, y: 0 }));

            const { minX, maxX, minY, maxY } = maxChildBounds(childPlaceables);
            return {
              intrinsicDims: [
                { min: minX, size: maxX - minX, center: minX + (maxX - minX) / 2, max: maxX },
                { min: minY, size: maxY - minY, center: minY + (maxY - minY) / 2, max: maxY },
              ],
              transform: { translate: [undefined, undefined] },
            };
          },
          render: ({ intrinsicDims, transform }, renderedChildren, node) => {
            requireTwoChildren(renderedChildren);
            return (
              <g
                transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0
                  })`}
              >
                {renderComposite(node, renderedChildren, intrinsicDims, operator, blendMode)}
              </g>
            );
          },
        },
        children
      );
    }
  );

export const over = createCompositeRelation("over", "over");
export const inside = createCompositeRelation("in", "in");
export const xor = createCompositeRelation("xor", "xor");
export const out = createCompositeRelation("out", "out");
export const atop = createCompositeRelation("atop", "atop");

export const mask = createOperator((_: Record<string, never>, children: GoFishAST[]) => {
  requireTwoChildren(children);

  return new GoFishNode(
    {
      type: "mask",
      shared: [false, false],
      resolveUnderlyingSpace: (
        _children: Size<UnderlyingSpace>[],
        _childNodes: GoFishAST[]
      ) => [UNDEFINED, UNDEFINED],
      inferSizeDomains: (_shared, layoutChildren) => {
        requireTwoChildren(layoutChildren);
        const childMeasures = layoutChildren.map((child) => child.inferSizeDomains());
        return {
          w: Monotonic.max(...childMeasures.map((measure) => measure[0])),
          h: Monotonic.max(...childMeasures.map((measure) => measure[1])),
        };
      },
      layout: (_shared, size, scaleFactors, layoutChildren, _measurement, posScales) => {
        requireTwoChildren(layoutChildren);

        const childPlaceables = layoutChildren.map((child) =>
          child.layout(size, scaleFactors, posScales)
        );
        childPlaceables.forEach((child) => child.place({ x: 0, y: 0 }));

        const { minX, maxX, minY, maxY } = maxChildBounds(childPlaceables);
        return {
          intrinsicDims: [
            { min: minX, size: maxX - minX, center: minX + (maxX - minX) / 2, max: maxX },
            { min: minY, size: maxY - minY, center: minY + (maxY - minY) / 2, max: maxY },
          ],
          transform: { translate: [undefined, undefined] },
        };
      },
      render: ({ transform }, renderedChildren, node) => {
        requireTwoChildren(renderedChildren);

        const uid = `pd-mask-${node.uid}`;
        const sourceId = `${uid}-source`;
        const destinationId = `${uid}-destination`;
        const maskId = `${uid}-mask`;

        return (
          <g
            transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0
              })`}
          >
            <defs>
              <g id={sourceId}>{renderedChildren[0]}</g>
              <g id={destinationId}>{renderedChildren[1]}</g>
              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
              >
                <use href={`#${sourceId}`} />
              </mask>
            </defs>
            <use href={`#${destinationId}`} mask={`url(#${maskId})`} />
          </g>
        );
      },
    },
    children
  );
});
