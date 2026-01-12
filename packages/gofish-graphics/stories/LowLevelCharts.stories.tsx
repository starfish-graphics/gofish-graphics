import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";
import { orderBy } from "../src/lib";
import {
  testBoxWhiskerPlot,
  testSingleBoxWhisker,
  testPairBoxWhisker,
} from "../src/tests/boxwhisker";

const meta: Meta = {
  title: "Charts/LowLevel",
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

export const SingleBoxWhisker: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    testSingleBoxWhisker().render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const PairBoxWhisker: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    testPairBoxWhisker().render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const BoxWhisker: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    testBoxWhiskerPlot().render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
