import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { titanic } from "../../src/data/titanic";
import { frame as Frame, SpreadX, SpreadY, StackY, Rect, For, ConnectX, Ref } from "../../src/lib";
import { color6, gray, neutral } from "../../src/color";
import { groupBy } from "lodash";
import _ from "lodash";

const meta: Meta = {
  title: "Low Level Syntax/Sankey Tree",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
};
export default meta;

type Args = { w: number; h: number };

const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

export const Default: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    const layerSpacing = 64;
    const internalSpacing = 2;
    Frame([
      SpreadX({ spacing: layerSpacing, alignment: "middle" }, [
        StackY(
          { spacing: 0, alignment: "middle" },
          For(groupBy(titanic, "class"), (items, cls) =>
            Rect({
              w: 40,
              h: _(items).sumBy("count") / 10,
              fill: neutral,
            }).name(`${cls}-src`)
          )
        ),
        SpreadY(
          { spacing: internalSpacing, alignment: "middle" },
          For(groupBy(titanic, "class"), (items, cls) =>
            SpreadX({ spacing: layerSpacing, alignment: "middle" }, [
              StackY(
                { spacing: 0, alignment: "middle" },
                For(groupBy(items, "sex"), (items, sex) =>
                  Rect({
                    w: 40,
                    h: _(items).sumBy("count") / 10,
                    fill: classColor[cls],
                  }).name(`${cls}-${sex}-src`)
                )
              ).name(`${cls}-tgt`),
              SpreadY(
                {
                  h: _(items).sumBy("count") / 10,
                  spacing: internalSpacing * 2,
                  alignment: "middle",
                },
                For(groupBy(items, "sex"), (items, sex) =>
                  SpreadX({ spacing: layerSpacing, alignment: "middle" }, [
                    StackY(
                      {
                        spacing: 0,
                        alignment: "middle",
                      },
                      For(groupBy(items, "survived"), (survivedItems, survived) =>
                        Rect({
                          w: 40,
                          h: _(survivedItems).sumBy("count") / 10,
                          fill: sex === "Female" ? color6[4] : color6[5],
                        }).name(`${cls}-${sex}-${survived}-src`)
                      )
                    ).name(`${cls}-${sex}-tgt`),
                    SpreadY(
                      {
                        w: 40,
                        spacing: internalSpacing * 4,
                        alignment: "middle",
                      },
                      For(groupBy(items, "survived"), (survivedItems, survived) => {
                        return Rect({
                          h: _(survivedItems).sumBy("count") / 10,
                          fill:
                            sex === "Female"
                              ? survived === "No"
                                ? gray
                                : color6[4]
                              : survived === "No"
                                ? gray
                                : color6[5],
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
      For(groupBy(titanic, "class"), (items, cls) => [
        ConnectX(
          {
            fill: classColor[cls],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [Ref(`${cls}-src`), Ref(`${cls}-tgt`)]
        ),
        For(groupBy(items, "sex"), (sexItems, sex) => [
          ConnectX(
            {
              fill: sex === "Female" ? color6[4] : color6[5],
              interpolation: "bezier",
              opacity: 0.7,
            },
            [Ref(`${cls}-${sex}-src`), Ref(`${cls}-${sex}-tgt`)]
          ),
          For(groupBy(sexItems, "survived"), (survivedItems, survived) =>
            ConnectX(
              {
                fill:
                  sex === "Female"
                    ? survived === "No"
                      ? gray
                      : color6[4]
                    : survived === "No"
                      ? gray
                      : color6[5],
                interpolation: "bezier",
                opacity: 0.7,
              },
              [
                Ref(`${cls}-${sex}-${survived}-src`),
                Ref(`${cls}-${sex}-${survived}-tgt`),
              ]
            )
          ),
        ]),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}
