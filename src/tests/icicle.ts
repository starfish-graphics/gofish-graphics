import _, { groupBy } from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/shapes/rect";
import {
  black,
  color,
  color6,
  color6_old,
  gray,
  neutral,
  tailwindColors,
  tailwindColorsVivid,
  white,
} from "../color";
import { titanic } from "../data/titanic";
import { mix } from "spectral.js";
import { For, Rect, StackX, StackY } from "../lib";

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

const mixPct = {
  // First: 0,
  // Second: 0.45,
  // Third: 0.6,
  // Crew: 0.75,
  First: 0.65,
  Second: 0.525,
  Third: 0.4,
  Crew: 0,
};

const classBaseColor = color6[1];

const classColor = {
  // First: mix(classBaseColor, neutral, mixPct.First),
  // Second: mix(classBaseColor, neutral, mixPct.Second),
  // Third: mix(classBaseColor, neutral, mixPct.Third),
  // Crew: mix(classBaseColor, neutral, mixPct.Crew),
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

export const testIcicle = () =>
  stack({ direction: "x", spacing: 0, alignment: "middle" }, [
    rect({
      w: 40,
      h: _(titanic).sumBy("count") / 10,
      fill: neutral,
    }),
    stack(
      { direction: "y", spacing: 0, alignment: "middle" },
      _(titanic)
        .groupBy("class")
        .map((items, cls) =>
          stack(
            {
              direction: "x",
              h: _(items).sumBy("count") / 10,
              spacing: 0,
              alignment: "start",
            },
            [
              rect({ w: 40, fill: classColor[cls as keyof typeof classColor] }),
              stack(
                { direction: "y", spacing: 0, alignment: "middle" },
                _(items)
                  .groupBy("sex")
                  .map((items, sex) =>
                    stack({ direction: "x", spacing: 0, alignment: "middle" }, [
                      rect({
                        w: 0,
                        h: _(items).sumBy("count") / 10,
                        // fill: mix(
                        //   sex === "Female" ? color6[3] : color6[4],
                        //   neutral,
                        //   mixPct[cls as keyof typeof mixPct]
                        // ),
                        fill: sex === "Female" ? color6[4] : color6[5],
                      }),
                      stack(
                        {
                          w: 40,
                          direction: "y",
                          spacing: 0,
                          alignment: "middle",
                        },
                        _(items)
                          .groupBy("survived")
                          .map((survivedItems, survived) => {
                            return rect({
                              // w: _(items).sumBy("count"),
                              // w: _(survivedItems).sumBy("count") / 10,
                              h: _(survivedItems).sumBy("count") / 10,
                              // h: value(_(items).sumBy("count"), "count"),
                              // h: _(items).sumBy("count") / 10,
                              fill:
                                sex === "Female"
                                  ? survived === "No"
                                    ? gray
                                    : // : mix(
                                      //     color6[3],
                                      //     neutral,
                                      //     mixPct[cls as keyof typeof mixPct]
                                      //   )
                                      color6[4]
                                  : survived === "No"
                                    ? gray
                                    : color6[5],
                            });
                          })
                          .value()
                      ),
                    ])
                  )
                  .value()
              ),
            ]
          )
        )
        .value()
    ),
  ]);

export const testIcicleAPIv2 = () =>
  StackX({ spacing: 0, alignment: "middle" }, [
    Rect({
      w: 40,
      h: _(titanic).sumBy("count") / 10,
      fill: gray,
    }),
    StackY(
      { spacing: 0, alignment: "middle" },
      For(groupBy(titanic, "class"), (items, cls) =>
        StackX(
          { h: _(items).sumBy("count") / 10, spacing: 0, alignment: "start" },
          [
            Rect({ w: 40, fill: classColor[cls as keyof typeof classColor] }),
            StackY(
              { spacing: 0, alignment: "middle" },
              For(groupBy(items, "sex"), (items, sex) =>
                StackX({ spacing: 0, alignment: "middle" }, [
                  Rect({
                    w: 40,
                    h: _(items).sumBy("count") / 10,
                    fill: sex === "Female" ? color6_old[2] : color6_old[3],
                  }),
                  StackY(
                    {
                      w: 40,
                      spacing: 0,
                      alignment: "middle",
                    },
                    For(
                      groupBy(items, "survived"),
                      (survivedItems, survived) => {
                        return Rect({
                          // w: _(items).sumBy("count"),
                          // w: _(survivedItems).sumBy("count") / 10,
                          h: _(survivedItems).sumBy("count") / 10,
                          // h: value(_(items).sumBy("count"), "count"),
                          // h: _(items).sumBy("count") / 10,
                          fill:
                            sex === "Female"
                              ? survived === "No"
                                ? mix(color6_old[2], black, 0.5)
                                : mix(color6_old[2], white, 0.5)
                              : survived === "No"
                                ? mix(color6_old[3], black, 0.5)
                                : mix(color6_old[3], white, 0.5),
                        });
                      }
                    )
                  ),
                ])
              )
            ),
          ]
        )
      )
    ),
  ]);
