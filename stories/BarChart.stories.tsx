import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";
import { orderBy } from "../src/lib";
import { filter_defs } from "../src/ast/texture/temp_filter";

const meta: Meta = {
  title: "Charts/BarChart",
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

export const Vertical: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return rect(catchData, {
      fill: "lake",
      h: "count",
      filter: "url(#filter-drop-shadow)",
    })
      .spreadX("lake")
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        defs: filter_defs,
      });
  },
};

export const Negative: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    const testData = [
      { category: "A", value: -30 },
      { category: "B", value: 80 },
      { category: "C", value: 45 },
      { category: "D", value: 60 },
      { category: "E", value: 20 },
    ];

    return rect(testData, {
      fill: "category",
      h: "value",
    })
      .spreadX("category")
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const Horizontal: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return rect(catchData, { fill: "lake", w: "count" })
      .spreadY("lake", { alignment: "start" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const MiddleAligned: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, { fill: "lake", h: "count" })
      .spreadX("lake", { alignment: "middle" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const Stacked: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, { fill: "species", h: "count" })
      .stackY("species")
      .transform((d) => orderBy(d, "count", "asc"))
      .spreadX("lake", { alignment: "start" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const StackedWithSpacing: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, { fill: "species", h: "count" })
      .spreadY("species", { spacing: 4 })
      .transform((d) => orderBy(d, "count", "asc"))
      .spreadX("lake", { alignment: "start" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};
