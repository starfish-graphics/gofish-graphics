import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/stack";
import { rect } from "../ast/rect";
import { color } from "../color";

const data = [
  { category: "A", group: "x", value: 0.1 },
  { category: "A", group: "y", value: 0.6 },
  { category: "A", group: "z", value: 0.9 },
  { category: "B", group: "x", value: 0.7 },
  { category: "B", group: "y", value: 0.2 },
  { category: "B", group: "z", value: 1.1 },
  { category: "C", group: "x", value: 0.6 },
  { category: "C", group: "y", value: 0.1 },
  { category: "C", group: "z", value: 0.2 },
];

console.log(Object.entries(color).map(([color, range]) => range[5]));

export const testColorPalette = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stack(
      { direction: 0, spacing: 8, alignment: "end" },
      // TODO: I could probably make the width be uniform flexible basically
      Object.entries(color).map(([color, range]) =>
        stack(
          { direction: 1, spacing: 8, alignment: "middle" },
          range.map((d, i) =>
            rect({
              w: 30,
              h: 30,
              fill: d,
              // fill: range[5],
            })
          )
        )
      )
    )
  );
