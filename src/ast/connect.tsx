import { GoFishAST } from "./_ast";
import { GoFishNode } from "./_node";
import { elaborateDirection, FancyDirection, Size } from "./dims";

export const connect = (
  { direction, fill, interpolation }: { direction: FancyDirection; fill: string; interpolation: string },
  children: GoFishAST[]
) => {
  const dir = elaborateDirection(direction);

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
        if (props.direction === "horizontal") {
          if (props.interpolation === "linear" || props.interpolation === undefined) {
            for (const [b0, b1] of bboxPairs) {
              segments.push([
                {
                  type: "line",
                  points: [
                    [b0.bbox.right!, b0.bbox.top!],
                    [b1.bbox.left!, b1.bbox.top!],
                  ],
                },
                {
                  type: "line",
                  points: [
                    [b1.bbox.left!, b1.bbox.top!],
                    [b1.bbox.left!, b1.bbox.bottom!],
                  ],
                },
                {
                  type: "line",
                  points: [
                    [b0.bbox.left!, b0.bbox.bottom!],
                    [b0.bbox.right!, b0.bbox.bottom!],
                  ],
                },
              ]);
            }
          } else if (props.interpolation === "bezier") {
            for (const [b0, b1] of bboxPairs) {
              const midX = (b0.bbox.right! + b1.bbox.left!) / 2;
              segments.push([
                {
                  type: "bezier",
                  start: [b0.bbox.right!, b0.bbox.top!],
                  control1: [midX, b0.bbox.top!],
                  control2: [midX, b1.bbox.top!],
                  end: [b1.bbox.left!, b1.bbox.top!],
                },
                {
                  type: "line",
                  points: [
                    [b1.bbox.left!, b1.bbox.top!],
                    [b1.bbox.left!, b1.bbox.bottom!],
                  ],
                },
                {
                  type: "bezier",
                  start: [b1.bbox.left!, b1.bbox.bottom!],
                  control1: [midX, b1.bbox.bottom!],
                  control2: [midX, b0.bbox.bottom!],
                  end: [b0.bbox.right!, b0.bbox.bottom!],
                },
                {
                  type: "line",
                  points: [
                    [b0.bbox.right!, b0.bbox.bottom!],
                    [b0.bbox.right!, b0.bbox.top!],
                  ],
                },
              ]);
            }
          }
        } else {
          if (props.interpolation === "linear" || props.interpolation === undefined) {
            for (const [b0, b1] of bboxPairs) {
              segments.push([
                {
                  type: "line",
                  points: [
                    [b0.bbox.left!, b0.bbox.bottom!],
                    [b1.bbox.left!, b1.bbox.top!],
                  ],
                },
                {
                  type: "line",
                  points: [
                    [b1.bbox.left!, b1.bbox.top!],
                    [b1.bbox.right!, b1.bbox.top!],
                  ],
                },
                {
                  type: "line",
                  points: [
                    [b1.bbox.right!, b1.bbox.top!],
                    [b0.bbox.right!, b0.bbox.bottom!],
                  ],
                },
              ]);
            }
          } else if (props.interpolation === "bezier") {
            for (const [b0, b1] of bboxPairs) {
              const midY = (b0.bbox.bottom! + b1.bbox.top!) / 2;
              segments.push([
                {
                  type: "bezier",
                  start: [b0.bbox.left!, b0.bbox.bottom!],
                  control1: [b0.bbox.left!, midY],
                  control2: [b1.bbox.left!, midY],
                  end: [b1.bbox.left!, b1.bbox.top!],
                },
                {
                  type: "line",
                  points: [
                    [b1.bbox.left!, b1.bbox.top!],
                    [b1.bbox.right!, b1.bbox.top!],
                  ],
                },
                {
                  type: "bezier",
                  start: [b1.bbox.right!, b1.bbox.top!],
                  control1: [b1.bbox.right!, midY],
                  control2: [b0.bbox.right!, midY],
                  end: [b0.bbox.right!, b0.bbox.bottom!],
                },
                {
                  type: "line",
                  points: [
                    [b0.bbox.right!, b0.bbox.bottom!],
                    [b0.bbox.left!, b0.bbox.bottom!],
                  ],
                },
              ]);
            }
          }
        }

        return {
          intrinsicDims: { w: size[0], h: size[1] },
          transform: { translate: [0, 0] },
        };
      },
      render: ({ intrinsicDims, transform }, children) => {
        return (
          <g transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}>
            {children}
          </g>
        );
      },
    },
    children
  );
};
