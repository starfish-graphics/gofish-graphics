import { color, color6 } from "../color";
import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/shapes/rect";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar_DEPRECATED } from "../ast/coordinateTransforms/polar_DEPRECATED";

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

export const testPolarRectAreaXY = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 100, y: 100 } },
    coord({ transform: polar_DEPRECATED(), grid: true }, [
      rect({ x: 0, y: 0, w: value(10), h: value(15), fill: color6[0] }),
      rect({ x: 0, y: 0, w: value(10), h: value(40), fill: color6[1] }),
      rect({ x: 0, y: 0, w: value(10), h: value(40), fill: color6[2] }),
      rect({ x: 0, y: 0, w: value(10), h: value(15), fill: color6[3] }),
    ])
  );
