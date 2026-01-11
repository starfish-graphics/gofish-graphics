import { For } from "solid-js";
import {
  Path,
  PathSegment,
  pathToSVGPath,
  transformPath,
  subdividePath,
} from "../../path";
import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import { elaborateDirection, FancyDirection, Size } from "../dims";
import { pairs } from "../../util";
import { linear } from "../coordinateTransforms/linear";
import { getValue, isValue, MaybeValue } from "../data";
import { scaleContext } from "../gofish";
import { Domain } from "../domain";
import * as Monotonic from "../../util/monotonic";
import { UNDEFINED, UnderlyingSpace } from "../underlyingSpace";
import { withGoFish } from "../withGoFish";

export const connect = withGoFish(
  (
    {
      direction,
      fill,
      interpolation,
      stroke,
      strokeWidth,
      opacity,
      mode = "edge-to-edge",
      mixBlendMode,
    }: {
      direction: FancyDirection;
      fill?: MaybeValue<string>;
      interpolation?: "linear" | "bezier";
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      mode?: "edge-to-edge" | "center-to-center";
      mixBlendMode?: "multiply" | "normal";
    },
    children: GoFishAST[]
  ) => {
    const dir = elaborateDirection(direction);
    interpolation = interpolation ?? "linear";

    return new GoFishNode(
      {
        type: "connect",
        shared: [false, false],
        color: fill,
        resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
          return [UNDEFINED, UNDEFINED];
        },
        inferSizeDomains: (shared, children) => {
          return {
            w: Monotonic.linear(0, 0),
            h: Monotonic.linear(0, 0),
          };
        },
        layout: (shared, size, scaleFactors, children) => {
          const defaultColor = children[0]?.color ?? "black";

          const paths: Path[] = [];

          if (mode === "edge-to-edge") {
            for (const child of children) {
              // toggle embedding on the direction axis
              (child as GoFishAST).embed(direction);
            }
          }

          const childPlaceables = children.map((child) =>
            child.layout(size, scaleFactors, [undefined, undefined])
          );
          const bboxPairs = pairs(childPlaceables.map((child) => child.dims));
          // If in center-to-center mode, adjust bounding boxes to have zero width/height
          // with min and max equal to the center point

          if (dir === 0) {
            if (interpolation === "linear") {
              if (mode === "center-to-center") {
                for (const [b0, b1] of bboxPairs) {
                  const midX = (b0[0].max! + b1[0].min!) / 2;
                  const midY = (b0[1].max! + b1[1].min!) / 2;
                  paths.push([
                    {
                      type: "line",
                      points: [
                        [
                          (b0[0].min! + b0[0].max!) / 2,
                          (b0[1].min! + b0[1].max!) / 2,
                        ],
                        [
                          (b1[0].min! + b1[0].max!) / 2,
                          (b1[1].min! + b1[1].max!) / 2,
                        ],
                      ],
                    },
                  ]);
                }
              } else {
                for (const [b0, b1] of bboxPairs) {
                  paths.push([
                    {
                      type: "line",
                      points: [
                        [b0[0].max!, b0[1].min!],
                        [b1[0].min!, b1[1].min!],
                      ],
                    },
                    {
                      type: "line",
                      points: [
                        [b1[0].min!, b1[1].min!],
                        [b1[0].min!, b1[1].max!],
                      ],
                    },
                    {
                      type: "line",
                      points: [
                        [b1[0].min!, b1[1].max!],
                        [b0[0].max!, b0[1].max!],
                      ],
                    },
                    {
                      type: "line",
                      points: [
                        [b0[0].max!, b0[1].max!],
                        [b0[0].max!, b0[1].min!],
                      ],
                    },
                  ]);
                }
              }
            } else if (interpolation === "bezier") {
              for (const [b0, b1] of bboxPairs) {
                const midX = (b0[0].max! + b1[0].min!) / 2;
                paths.push([
                  {
                    type: "bezier",
                    start: [b0[0].max!, b0[1].min!],
                    control1: [midX, b0[1].min!],
                    control2: [midX, b1[1].min!],
                    end: [b1[0].min!, b1[1].min!],
                  },
                  {
                    type: "line",
                    points: [
                      [b1[0].min!, b1[1].min!],
                      [b1[0].min!, b1[1].max!],
                    ],
                  },
                  {
                    type: "bezier",
                    start: [b1[0].min!, b1[1].max!],
                    control1: [midX, b1[1].max!],
                    control2: [midX, b0[1].max!],
                    end: [b0[0].max!, b0[1].max!],
                  },
                  {
                    type: "line",
                    points: [
                      [b0[0].max!, b0[1].max!],
                      [b0[0].max!, b0[1].min!],
                    ],
                  },
                ]);
              }
            }
          } else {
            if (interpolation === "linear") {
              if (mode === "center-to-center") {
                for (const [b0, b1] of bboxPairs) {
                  paths.push([
                    {
                      type: "line",
                      points: [
                        [
                          (b0[0].min! + b0[0].max!) / 2,
                          (b0[1].min! + b0[1].max!) / 2,
                        ],
                        [
                          (b1[0].min! + b1[0].max!) / 2,
                          (b1[1].min! + b1[1].max!) / 2,
                        ],
                      ],
                    },
                  ]);
                }
              } else {
                for (const [b0, b1] of bboxPairs) {
                  paths.push([
                    {
                      type: "line",
                      points: [
                        [b0[0].min!, b0[1].max!],
                        [b1[0].min!, b1[1].min!],
                      ],
                    },
                    {
                      type: "line",
                      points: [
                        [b1[0].min!, b1[1].min!],
                        [b1[0].max!, b1[1].min!],
                      ],
                    },
                    {
                      type: "line",
                      points: [
                        [b1[0].max!, b1[1].min!],
                        [b0[0].max!, b0[1].max!],
                      ],
                    },
                    {
                      type: "line",
                      points: [
                        [b0[0].max!, b0[1].max!],
                        [b0[0].min!, b0[1].max!],
                      ],
                    },
                  ]);
                }
              }
            } else if (interpolation === "bezier") {
              if (mode === "center-to-center") {
                for (const [b0, b1] of bboxPairs) {
                  paths.push([
                    {
                      type: "line",
                      points: [
                        [
                          (b0[0].min! + b0[0].max!) / 2,
                          (b0[1].min! + b0[1].max!) / 2,
                        ],
                        [
                          (b1[0].min! + b1[0].max!) / 2,
                          (b1[1].min! + b1[1].max!) / 2,
                        ],
                      ],
                    },
                  ]);
                }
              } else {
                for (const [b0, b1] of bboxPairs) {
                  const midY = (b0[1].max! + b1[1].min!) / 2;
                  paths.push([
                    {
                      type: "bezier",
                      start: [b0[0].min!, b0[1].max!],
                      control1: [b0[0].min!, midY],
                      control2: [b1[0].min!, midY],
                      end: [b1[0].min!, b1[1].min!],
                    },
                    {
                      type: "line",
                      points: [
                        [b1[0].min!, b1[1].min!],
                        [b1[0].max!, b1[1].min!],
                      ],
                    },
                    {
                      type: "bezier",
                      start: [b1[0].max!, b1[1].min!],
                      control1: [b1[0].max!, midY],
                      control2: [b0[0].max!, midY],
                      end: [b0[0].max!, b0[1].max!],
                    },
                    {
                      type: "line",
                      points: [
                        [b0[0].max!, b0[1].max!],
                        [b0[0].min!, b0[1].max!],
                      ],
                    },
                  ]);
                }
              }
            }
          }

          return {
            intrinsicDims: { w: size[0], h: size[1] },
            transform: { translate: [0, 0] },
            renderData: { paths, defaultColor },
          };
        },
        render: (
          { intrinsicDims, transform, renderData, coordinateTransform },
          children
        ) => {
          fill = fill ?? renderData.defaultColor;
          fill = isValue(fill)
            ? scaleContext?.unit?.color
              ? scaleContext.unit.color.get(getValue(fill))
              : getValue(fill)
            : fill;

          return (
            <g
              transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1]! ?? 0})`}
            >
              <For each={renderData.paths}>
                {(path) => {
                  const transformedPath = coordinateTransform
                    ? transformPath(
                        subdividePath(path, 1000),
                        coordinateTransform
                      )
                    : path;
                  const d = pathToSVGPath(transformedPath);
                  return (
                    <path
                      // filter="url(#crumpled-paper)"
                      style={{
                        "mix-blend-mode":
                          (mixBlendMode ?? mode === "center-to-center")
                            ? "normal"
                            : "multiply",
                      }}
                      d={d}
                      fill={fill ?? "none"}
                      stroke={stroke ?? fill ?? "black"}
                      stroke-width={strokeWidth ?? 0}
                      opacity={opacity ?? 1}
                    />
                  );
                }}
              </For>
            </g>
          );
        },
      },
      children
    );
  }
);
