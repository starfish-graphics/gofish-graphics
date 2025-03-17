import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/stack";
import { rect } from "../ast/rect";
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

export const testGroupedBar = (size: { width: number; height: number }) => {
  // Create the visualization structure first
  return gofish(
    { width: size.width, height: size.height },
    stack(
      { direction: 0, spacing: 20, alignment: "end", sharedScale: true },
      Object.entries(_.groupBy(data, "category")).map(([category, items]) =>
        stack(
          { direction: 0, spacing: 2, alignment: "end" },
          items.map((d) =>
            rect({
              w: 30,
              h: value(d.value, "value"),
              fill: d.group === "x" ? "red" : d.group === "y" ? "blue" : "green",
            })
          )
        )
      )
    )
  );
};
