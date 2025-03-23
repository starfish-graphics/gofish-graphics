import { color, color6 } from "../color";
import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";

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

export const testRect = (size: { width: number; height: number }) =>
  gofish({ width: size.width, height: size.height }, rect({ x: 10, y: 10, w: 30, h: 50, fill: color6[0] }));
