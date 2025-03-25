import { color, color6 /* color6_20250320v2 as color6 */ } from "../color";
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

export const testPolarRect = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 100, y: 100 } },
    coord({ transform: polar(), grid: true }, [
      rect({
        dims: [
          { min: 10, size: 30 },
          { min: 0, size: 20 },
        ],
        fill: color6[0],
      }),
      rect({
        dims: [
          { min: 50, size: 30 },
          { min: 0, size: 20 },
        ],
        fill: color6[1],
      }),
      rect({
        dims: [
          { min: 50, size: 30 },
          { min: Math.PI / 2, size: 50 },
        ],
        fill: color6[2],
      }),
      rect({
        dims: [
          { min: 50, size: 30 },
          { min: Math.PI / 3, size: 50 },
        ],
        fill: color6[3],
      }),
      rect({
        dims: [
          { min: 50, size: 30 },
          { min: Math.PI / 4, size: 50 },
        ],
        fill: color6[4],
      }),
      rect({
        dims: [
          { min: 50, size: 30 },
          { min: (3 * Math.PI) / 2, size: 50 },
        ],
        fill: color6[5],
      }),
    ])
  );
