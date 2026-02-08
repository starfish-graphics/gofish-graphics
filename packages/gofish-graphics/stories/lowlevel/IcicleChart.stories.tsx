import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { titanic } from "../../src/data/titanic";
import { StackX, StackY, Rect } from "../../src/lib";
import { color6, gray, neutral } from "../../src/color";
import _ from "lodash";

const meta: Meta = {
  title: "Low Level Syntax/Icicle Chart",
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
  args: { w: 500, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();

    StackX({ alignment: "middle" }, [
      Rect({
        w: 40,
        h: _(titanic).sumBy("count") / 10,
        fill: neutral,
      }),
      StackY(
        { dir: "ttb", alignment: "middle" },
        _(titanic)
          .groupBy("class")
          .map((items, cls) =>
            StackX(
              {
                h: _(items).sumBy("count") / 10,
                alignment: "start",
              },
              [
                Rect({ w: 40, fill: classColor[cls] }),
                StackY(
                  { dir: "ttb", alignment: "middle" },
                  _(items)
                    .groupBy("sex")
                    .map((items, sex) =>
                      StackX({ alignment: "middle" }, [
                        Rect({
                          w: 0,
                          h: _(items).sumBy("count") / 10,
                          fill: sex === "Female" ? color6[4] : color6[5],
                        }),
                        StackY(
                          {
                            w: 40,
                            dir: "ttb",
                            alignment: "middle",
                          },
                          _(items)
                            .groupBy("survived")
                            .map((survivedItems, survived) => {
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
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;

  }
}
