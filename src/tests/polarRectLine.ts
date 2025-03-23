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

export const testPolarRectLine = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 100, y: 100 } },
    coord(
      polar(),
      [
        rect({
          dims: [
            {
              min: 0,
              size: 100,
            },
            {
              min: 0,
              size: value(25, "test"),
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
              size: value(8, "test"),
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
            { min: 0, size: value(40, "test") },
          ],
          fill: color6[2],
        }),
      ],
      true
    )
  );
