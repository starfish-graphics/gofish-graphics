import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/shapes/rect";
import { color } from "../color";
import { Rect, StackX, StackY, v } from "../lib";

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

export const testMosaic = () =>
  StackX(
    { spacing: 4, alignment: "end", sharedScale: true },
    // TODO: I could probably make the width be uniform flexible basically
    Object.entries(_.groupBy(data, "origin")).map(([origin, items]) =>
      StackY(
        {
          // w: _(items).sumBy("count") / 2,
          w: v(_(items).sumBy("count")),
          spacing: 2,
          alignment: "middle",
          sharedScale: true,
        },
        items.toReversed().map((d) =>
          Rect({
            h: v(d.count),
            fill: v(d.origin),
          })
        )
      )
    )
  );

/* 
  
rect(data, { h: "count", fill: "origin" })
  .stackY("cylinders", { w: "count" })
  .stackX("origin")
  .render(root, { w: 500, h: 300 })
  */
