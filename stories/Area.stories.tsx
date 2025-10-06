import type { Meta, StoryObj } from "@storybook/html";
import { guide } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";

const meta: Meta = {
  title: "Charts/AreaChart",
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

export const Area: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return guide(catchData, { h: "count", fill: "species" })
      .spreadX("lake", { spacing: 60 })
      .connectX("lake", { opacity: 0.7 })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const Ridgeline: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return guide(catchData, { h: "count", fill: "species" })
      .spreadX("lake", { spacing: 80 })
      .connectX("lake", { mixBlendMode: "normal" })
      .spreadY("species", { spacing: -16 })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const RidgelineNoSpacing: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return guide(catchData, { h: "count", fill: "species" })
      .spreadX("lake", { spacing: 80 })
      .connectX("lake", { mixBlendMode: "normal" })
      .spreadY("species", { spacing: 0 })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};
