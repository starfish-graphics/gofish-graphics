import { For } from "solid-js";
import { Path, PathSegment, pathToSVGPath, transformPath, subdividePath } from "../../path";
import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import { elaborateDirection, FancyDirection, Size } from "../dims";
import { pairs } from "../../util";
import { linear } from "../coordinateTransforms/linear";

export const connect = (
  {
    direction,
    fill,
    interpolation,
    stroke,
    strokeWidth,
    opacity,
  }: {
    direction: FancyDirection;
    fill: string;
    interpolation?: "linear" | "bezier";
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  },
  children: GoFishAST[]
) => {
  const dir = elaborateDirection(direction);
  interpolation = interpolation ?? "linear";

  return new GoFishNode(
    {
      type: "connect",
      shared: [false, false],
      measure: (shared, size, children) => {
        return (scaleFactors: Size) => {
          return [size[0], size[1]];
        };
      },
      layout: (shared, size, scaleFactors, children) => {
        const paths: Path[] = [];

        const childPlaceables = children.map((child) => child.layout(size, scaleFactors));
        const bboxPairs = pairs(childPlaceables.map((child) => child.dims));

        if (dir === 0) {
          if (interpolation === "linear") {
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
          } else if (interpolation === "bezier") {
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

        return {
          intrinsicDims: { w: size[0], h: size[1] },
          transform: { translate: [0, 0] },
          renderData: { paths },
        };
      },
      render: ({ intrinsicDims, transform, renderData, coordinateTransform }, children) => {
        return (
          <g transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1]! ?? 0})`}>
            <For each={renderData.paths}>
              {(path) => {
                if (stroke === "black") {
                  console.log(path);
                }
                const transformedPath = coordinateTransform
                  ? transformPath(subdividePath(path, 1000), coordinateTransform)
                  : path;
                const d = pathToSVGPath(transformedPath);
                return (
                  <path
                    // filter="url(#crumpled-paper)"
                    style={{ "mix-blend-mode": "multiply" }}
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
};
