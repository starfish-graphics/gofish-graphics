import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";

const meta: Meta = {
  title: "Charts/Labels",
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


export const Horizontal: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return rect(catchData, { fill: "lake", w: "count" })
      .spreadY("lake", { alignment: "start", label: "middle:0 + center:0", })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

