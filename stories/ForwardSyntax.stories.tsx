import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";
import { chart, spread_by, rect } from "../src/ast/marks/chart-forward-v2";

const meta: Meta = {
  title: "Charts/ForwardSyntax",
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

export const BarChart: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return (
      chart(catchData)
        .flow(
          spread_by("lake", { dir: "x" }),
          rect({ h: "count", fill: "lake" })
        )
        // TODO: remove this... maybe once resolveUnderlyingSpace is fully implemented?
        .setShared([true, true])
        .render(container, {
          w: args.w,
          h: args.h,
          axes: true,
        })
    );
  },
};
