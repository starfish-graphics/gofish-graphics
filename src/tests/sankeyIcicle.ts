import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/shapes/rect";
import { black, color, color6, color6_old, white } from "../color";
import { titanic } from "../data/titanic";
import { mix } from "spectral.js";
import { layer } from "../ast/graphicalOperators/layer";
import { connect } from "../ast/graphicalOperators/connect";
import { ref } from "../ast/shapes/ref";
import { frame } from "../ast/graphicalOperators/frame";
import { Frame, StackY, StackX, Rect, groupBy, For, ConnectX } from "../lib";

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
  First: mix(color6_old[0], white, 0.5),
  Second: mix(color6_old[0], black, 0),
  Third: mix(color6_old[0], black, 0.4),
  Crew: mix(color6_old[0], black, 0.7),
};

const layerSpacing = 64;
const internalSpacing = 2;

export const testSankeyIcicle = () =>
  frame([
    stack({ direction: "x", spacing: layerSpacing, alignment: "middle" }, [
      stack(
        { direction: "y", spacing: 0, alignment: "middle" },
        _(titanic)
          .groupBy("class")
          .map((items, cls) =>
            rect({
              name: `${cls}-src`,
              w: 40,
              h: _(items).sumBy("count") / 10,
              fill: "gray",
            })
          )
          .value()
      ),
      stack(
        { direction: "y", spacing: internalSpacing, alignment: "middle" },
        _(titanic)
          .groupBy("class")
          .map((items, cls) =>
            stack({ direction: "x", spacing: layerSpacing, alignment: "middle" }, [
              stack(
                { name: `${cls}-tgt`, direction: "y", spacing: 0, alignment: "middle" },
                _(items)
                  .groupBy("sex")
                  .map((items, sex) =>
                    rect({
                      name: `${cls}-${sex}-src`,
                      w: 40,
                      h: _(items).sumBy("count") / 10,
                      fill: classColor[cls as keyof typeof classColor],
                    })
                  )
                  .value()
              ),
              stack(
                {
                  h: _(items).sumBy("count") / 10,
                  direction: "y",
                  spacing: internalSpacing * 2,
                  alignment: "middle",
                },
                _(items)
                  .groupBy("sex")
                  .map((items, sex) =>
                    stack({ direction: "x", spacing: layerSpacing, alignment: "middle" }, [
                      stack(
                        {
                          name: `${cls}-${sex}-tgt`,
                          direction: "y",
                          spacing: 0,
                          alignment: "middle",
                        },
                        _(items)
                          .groupBy("survived")
                          .map((survivedItems, survived) =>
                            rect({
                              name: `${cls}-${sex}-${survived}-src`,
                              w: 40,
                              h: _(survivedItems).sumBy("count") / 10,
                              fill: sex === "Female" ? color6_old[2] : color6_old[3],
                            })
                          )
                          .value()
                      ),
                      stack(
                        {
                          w: 40,
                          direction: "y",
                          spacing: internalSpacing * 4,
                          alignment: "middle",
                        },
                        _(items)
                          .groupBy("survived")
                          .map((survivedItems, survived) => {
                            return rect({
                              name: `${cls}-${sex}-${survived}-tgt`,
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
                          })
                          .value()
                      ),
                    ])
                  )
                  .value()
              ),
            ])
          )
          .value()
      ),
    ]),
    ..._(titanic)
      .groupBy("class")
      .flatMap((items, cls) => [
        connect(
          {
            direction: "x",
            fill: classColor[cls as keyof typeof classColor],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [ref(`${cls}-src`), ref(`${cls}-tgt`)]
        ),
        ..._(items)
          .groupBy("sex")
          .flatMap((sexItems, sex) => [
            connect(
              {
                direction: "x",
                fill: sex === "Female" ? color6_old[2] : color6_old[3],
                interpolation: "bezier",
                opacity: 0.7,
              },
              [ref(`${cls}-${sex}-src`), ref(`${cls}-${sex}-tgt`)]
            ),
            ..._(sexItems)
              .groupBy("survived")
              .map((survivedItems, survived) =>
                connect(
                  {
                    direction: "x",
                    fill:
                      sex === "Female"
                        ? survived === "No"
                          ? mix(color6_old[2], black, 0.5)
                          : mix(color6_old[2], white, 0.5)
                        : survived === "No"
                        ? mix(color6_old[3], black, 0.5)
                        : mix(color6_old[3], white, 0.5),
                    interpolation: "bezier",
                    opacity: 0.7,
                  },
                  [ref(`${cls}-${sex}-${survived}-src`), ref(`${cls}-${sex}-${survived}-tgt`)]
                )
              )
              .value(),
          ])
          .value(),
      ])
      .value(),
  ]);

export const testSankeyIcicleAPIv2 = () =>
  Frame([
    StackX({ spacing: layerSpacing, alignment: "middle" }, [
      StackY(
        { spacing: 0, alignment: "middle" },
        For(groupBy(titanic, "class"), (items, cls) =>
          Rect({
            w: 40,
            h: _(items).sumBy("count") / 10,
            fill: "gray",
          }).name(`${cls}-src`)
        )
      ),
      StackY(
        { spacing: internalSpacing, alignment: "middle" },
        For(groupBy(titanic, "class"), (items, cls) =>
          StackX({ spacing: layerSpacing, alignment: "middle" }, [
            StackY(
              { spacing: 0, alignment: "middle" },
              For(groupBy(items, "sex"), (items, sex) =>
                Rect({
                  w: 40,
                  h: _(items).sumBy("count") / 10,
                  fill: classColor[cls as keyof typeof classColor],
                }).name(`${cls}-${sex}-src`)
              )
            ).name(`${cls}-tgt`),
            StackY(
              {
                h: _(items).sumBy("count") / 10,
                spacing: internalSpacing * 2,
                alignment: "middle",
              },
              For(groupBy(items, "sex"), (items, sex) =>
                StackX({ spacing: layerSpacing, alignment: "middle" }, [
                  StackY(
                    {
                      spacing: 0,
                      alignment: "middle",
                    },
                    For(groupBy(items, "survived"), (survivedItems, survived) =>
                      Rect({
                        name: `${cls}-${sex}-${survived}-src`,
                        w: 40,
                        h: _(survivedItems).sumBy("count") / 10,
                        fill: sex === "Female" ? color6_old[2] : color6_old[3],
                      })
                    )
                  ).name(`${cls}-${sex}-tgt`),
                  StackY(
                    {
                      w: 40,
                      spacing: internalSpacing * 4,
                      alignment: "middle",
                    },
                    For(groupBy(items, "survived"), (survivedItems, survived) => {
                      return Rect({
                        name: `${cls}-${sex}-${survived}-tgt`,
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
                      }).name(`${cls}-${sex}-${survived}-tgt`);
                    })
                  ),
                ])
              )
            ),
          ])
        )
      ),
    ]),
    /* For(groupBy(titanic, "class"), (items, cls) => [
      ConnectX(
        {
          fill: classColor[cls as keyof typeof classColor],
          interpolation: "bezier",
          opacity: 0.7,
        },
        [ref(`${cls}-src`), ref(`${cls}-tgt`)]
      ),
      For(groupBy(items, "sex"), (sexItems, sex) => [
        ConnectX(
          {
            fill: sex === "Female" ? color6_old[2] : color6_old[3],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [ref(`${cls}-${sex}-src`), ref(`${cls}-${sex}-tgt`)]
        ),
        For(groupBy(sexItems, "survived"), (survivedItems, survived) =>
          ConnectX(
            {
              fill:
                sex === "Female"
                  ? survived === "No"
                    ? mix(color6_old[2], black, 0.5)
                    : mix(color6_old[2], white, 0.5)
                  : survived === "No"
                  ? mix(color6_old[3], black, 0.5)
                  : mix(color6_old[3], white, 0.5),
              interpolation: "bezier",
              opacity: 0.7,
            },
            [ref(`${cls}-${sex}-${survived}-src`), ref(`${cls}-${sex}-${survived}-tgt`)]
          )
        ),
      ]),
    ]), */
  ]);
