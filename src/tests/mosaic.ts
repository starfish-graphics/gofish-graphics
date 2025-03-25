import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/marks/rect";
import { color } from "../color";

const data = [
  { origin: "Europe", cylinders: "4", count: 66 },
  { origin: "Europe", cylinders: "5", count: 3 },
  { origin: "Europe", cylinders: "6", count: 4 },
  { origin: "Japan", cylinders: "3", count: 4 },
  { origin: "Japan", cylinders: "4", count: 69 },
  { origin: "Japan", cylinders: "6", count: 6 },
  { origin: "USA", cylinders: "4", count: 72 },
  { origin: "USA", cylinders: "6", count: 74 },
  { origin: "USA", cylinders: "8", count: 108 },
];

export const testMosaic = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stack(
      { direction: 0, spacing: 4, alignment: "end" },
      // TODO: I could probably make the width be uniform flexible basically
      Object.entries(_.groupBy(data, "origin")).map(([origin, items]) =>
        stack(
          { w: _(items).sumBy("count") / 2, direction: 1, spacing: 2, alignment: "middle", sharedScale: true },
          items.toReversed().map((d) =>
            rect({
              h: value(d.count, "count"),
              fill: d.origin === "Europe" ? color.red[5] : d.origin === "Japan" ? color.blue[5] : color.green[5],
            })
          )
        )
      )
    )
  );
