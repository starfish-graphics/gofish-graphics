import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/marks/rect";
import { black, color, color6, color6_old } from "../color";
import { titanic } from "../data/titanic";
import { mix } from "spectral.js";

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

const classColor = {
  First: color6_old[0],
  Second: color6_old[1],
  Third: color6_old[2],
  Crew: color6_old[3],
};

export const testNestedMosaic = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stack(
      { direction: "y", spacing: 4, alignment: "middle" },
      // TODO: I could probably make the width be uniform flexible basically
      _(titanic)
        .groupBy("class")
        .map(
          (items, cls) =>
            stack(
              { h: _(items).sumBy("count") / 10, direction: "x", spacing: 2, alignment: "middle" },
              _(items)
                .groupBy("sex")
                .map((sItems, sex) =>
                  stack(
                    {
                      w: (_(sItems).sumBy("count") / _(items).sumBy("count")) * 100,
                      direction: "y",
                      spacing: 0,
                      alignment: "middle",
                      sharedScale: true,
                    },
                    _(sItems)
                      .groupBy("survived")
                      .map((items, survived) =>
                        rect({
                          h: value(_(items).sumBy("count"), "survived"),
                          // h: value(_(items).sumBy("count"), "count"),
                          // h: _(items).sumBy("count") / 10,
                          fill:
                            survived === "No"
                              ? mix(classColor[cls as keyof typeof classColor], black, 0.7)
                              : classColor[cls as keyof typeof classColor],
                        })
                      )
                      .value()
                  )
                )
                .value()
            )
          // stack(
          //   { /* w: _(items).sumBy("count") / 2, */ direction: 1, spacing: 2, alignment: "middle", sharedScale: true },
          //   items.toReversed().map((d) =>
          //     rect({
          //       w: 20,
          //       h: value(d.count, "count"),
          //       fill: classColor[cls as keyof typeof classColor],
          //     })
          //   )
          // )
        )
        .value()
    )
  );
