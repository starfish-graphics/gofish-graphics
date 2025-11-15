import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchLocationsArray } from "../src/data/catch";
import { orderBy, color } from "../src/lib";

export default {
  title: "Charts/Scatter",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
} as Meta;

type Args = { w: number; h: number };

export const Scatter: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    rect(catchLocationsArray, {
      fill: color.blue[5],
      rx: 20,
      ry: 20,
      w: 20,
      h: 20,
    })
      .scatter("lake", { x: "x", y: "y" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
    return container;
  },
};
