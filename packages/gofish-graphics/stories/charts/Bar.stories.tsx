import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { bar } from "../../src/charts/bar";
import { circle } from "../../src/lib";

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

// Test data for bar charts
const testData = [
  { category: "A", value: 30, color: "#ff6b6b" },
  { category: "B", value: 80, color: "#4ecdc4" },
  { category: "C", value: 45, color: "#45b7d1" },
  { category: "D", value: 60, color: "#f9ca24" },
  { category: "E", value: 20, color: "#6c5ce7" },
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

export const VerticalWithFillColor: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, { x: "category", h: "value", fill: "#4ecdc4" }).render(
      container,
      {
        w: args.w,
        h: args.h,
        axes: true,
      }
    );

    return container;
  },
};

export const HorizontalWithFillColor: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, { y: "category", w: "value", fill: "#ff6b6b" }).render(
      container,
      {
        w: args.w,
        h: args.h,
        axes: true,
      }
    );

    return container;
  },
};

export const VerticalWithFillField: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, {
      x: "category",
      h: "value",
      fill: "color",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const HorizontalWithFillField: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, {
      y: "category",
      w: "value",
      fill: "color",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const VerticalWithCustomMark: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, {
      x: "category",
      h: "value",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const HorizontalWithCustomMark: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, {
      y: "category",
      w: "value",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const VerticalWithCustomMarkAndFill: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, {
      x: "category",
      h: "value",
      fill: "#6c5ce7",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const HorizontalWithCustomMarkAndFill: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    bar(testData, {
      y: "category",
      w: "value",
      fill: "#f9ca24",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
