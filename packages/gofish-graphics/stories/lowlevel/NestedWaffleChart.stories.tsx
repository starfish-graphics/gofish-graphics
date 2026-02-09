import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { titanic } from "../../src/data/titanic";
import { SpreadY, SpreadX, Enclose, Ellipse } from "../../src/lib";
import { color6, gray } from "../../src/color";
import _ from "lodash";

const meta: Meta = {
  title: "Low Level Syntax/Nested Waffle Chart",
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
  args: { w: 500, h: 340 },
  render: (args: Args) => {
    const container = initializeContainer();
    SpreadY(
      { direction: "y", spacing: 8, alignment: "middle", sharedScale: true },
      _(titanic)
        .groupBy("class")
        .map((cls) =>
          SpreadX(
            { spacing: 4, alignment: "end" },
            _(cls)
              .groupBy("sex")
              .map((sex) =>
                Enclose({}, [
                  SpreadY(
                    { spacing: 0.5, alignment: "end" },
                    _(sex) // Was missing this lodash chain before .reverse()
                      .reverse()
                      .flatMap((d) => Array(d.count).fill(d))
                      .chunk(
                        Math.ceil(
                          (_(sex).sumBy("count") / _(cls).sumBy("count")) * 32
                        )
                      )
                      .reverse()
                      .map((d) =>
                        SpreadX(
                          { spacing: 0.5, alignment: "end" },
                          d.map((d) =>
                            Ellipse({
                              w: 4,
                              h: 4,
                              fill:
                                d.survived === "No"
                                  ? gray
                                  : /* value(d.class) */ classColor[d.class],
                            })
                          )
                        )
                      )
                      .value()
                  ),
                ])
              )
              .value()
          )
        )
        .value()
    ).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}
