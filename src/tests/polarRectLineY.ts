import { color, color6 } from "../color";
import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar } from "../ast/coordinateTransforms/polar";

const data = [
  { a: "A", b: 28 },
  { a: "B", b: 55 },
  { a: "C", b: 43 },
  { a: "D", b: 91 },
  { a: "E", b: 81 },
  { a: "F", b: 53 },
  { a: "G", b: 19 },
  { a: "H", b: 87 },
  { a: "I", b: 52 },
];

export const testPolarRectLineY = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 100, y: 100 } },
    coord({ transform: polar(), grid: true }, [
      rect({
        dims: [
          {
            min: 20,
            size: 50,
          },
          {
            min: value(0, "test"),
            size: value(Math.PI / 2, "test"),
          },
        ],
        fill: color6[0],
      }),
      rect({
        dims: [
          {
            min: 0,
            size: 20,
          },
          {
            min: 0,
            size: value(Math.PI / 3, "test"),
          },
        ],
        fill: color6[1],
      }),
      rect({
        dims: [
          {
            min: 0,
            size: 10,
          },
          { min: 0, size: value(Math.PI / 4, "test") },
        ],
        fill: color6[2],
      }),
    ])
  );
