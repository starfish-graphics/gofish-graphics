import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";
import { chart, spread, rectForward as rect } from "../src/lib";

const meta: Meta = {
  title: "Forward Syntax V3",
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
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    const node = chart(catchData)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count", fill: "species" }));

    node.render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
