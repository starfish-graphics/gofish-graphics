import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { bar } from "../../src/charts/bar";

const meta: Meta = {
  title: "Charts/Bar",
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

// Simple test data for bar charts
const testData = [
  { category: "A", value: 30 },
  { category: "B", value: 80 },
  { category: "C", value: 45 },
  { category: "D", value: 60 },
  { category: "E", value: 20 },
];

export const Vertical: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, { x: "category", h: "value" }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const Horizontal: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, { y: "category", w: "value" }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
