import * as BubbleSets from "bubblesets-js";
import { GoFishNode } from "../_node";
import { Size } from "../dims";
import { GoFishAST } from "../_ast";
import { black, gray, tailwindColors } from "../../color";
import { Domain } from "../domain";
import * as Monotonic from "../../util/monotonic";

export const enclose = (
  {
    padding = 2,
    rx = 2,
    ry = 2,
  }: { padding?: number; rx?: number; ry?: number },
  children: GoFishAST[]
) => {
  return new GoFishNode(
    {
      type: "enclose",
      shared: [false, false],
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        return [undefined, undefined];
      },
      inferSizeDomains: (shared, size, children) => {
        const childMeasures = children.map((child) =>
          child.inferSizeDomains(size)
        );

        const childMeasuresWidth = childMeasures.map((cm) => cm[0]);
        const childMeasuresHeight = childMeasures.map((cm) => cm[1]);

        return {
          w:
            childMeasuresWidth.every(Monotonic.isLinear) &&
            childMeasuresWidth.every(
              (childMeasureWidth) =>
                childMeasureWidth.intercept === childMeasuresWidth[0].intercept
            )
              ? Monotonic.linear(
                  Math.max(...childMeasuresWidth.map((cw) => cw.slope)),
                  childMeasuresWidth[0].intercept + padding * 2
                )
              : Monotonic.unknown(
                  (scaleFactor: number) =>
                    Math.max(
                      ...childMeasuresWidth.map((cw) => cw.run(scaleFactor))
                    ) +
                    padding * 2
                ),
          h:
            childMeasuresHeight.every(Monotonic.isLinear) &&
            childMeasuresHeight.every(
              (childMeasureHeight) =>
                childMeasureHeight.intercept ===
                childMeasuresHeight[0].intercept
            )
              ? Monotonic.linear(
                  Math.max(...childMeasuresHeight.map((ch) => ch.slope)),
                  childMeasuresHeight[0].intercept + padding * 2
                )
              : Monotonic.unknown((scaleFactor: number) =>
                  Math.max(
                    ...childMeasuresHeight.map(
                      (ch) => ch.run(scaleFactor) + padding * 2
                    )
                  )
                ),
        };
      },
      layout: (shared, size, scaleFactors, children) => {
        const childPlaceables = [];

        for (const child of children) {
          const childPlaceable = child.layout(size, scaleFactors);
          childPlaceable.place({ x: 0, y: 0 });
          childPlaceables.push(childPlaceable);
        }

        const maxWidth = Math.max(
          ...childPlaceables.map(
            (childPlaceable) => childPlaceable.dims[0].max!
          )
        );
        const maxHeight = Math.max(
          ...childPlaceables.map(
            (childPlaceable) => childPlaceable.dims[1].max!
          )
        );
        return {
          intrinsicDims: {
            x: -padding,
            y: -padding,
            w: maxWidth + padding * 2,
            h: maxHeight + padding * 2,
          },
          transform: { translate: [undefined, undefined] },
        };
      },
      render: ({ intrinsicDims, transform, renderData }, children) => {
        return (
          <g
            transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}
          >
            {children}
            <rect
              x={-padding}
              y={-padding}
              width={intrinsicDims?.[0]?.size ?? 0}
              height={intrinsicDims?.[1]?.size ?? 0}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={gray}
              stroke-width={1}
            />
          </g>
        );
      },
    },
    children
  );
};
