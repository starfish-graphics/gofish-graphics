import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "./helper";
import { seafood } from "../src/data/catch";
import {
  chart,
  spread,
  rectForward as rect,
  stackForward as stack,
  derive,
} from "../src/lib";
import { repeat } from "../src/ast/marks/chart-forward-v3";
import _ from "lodash";
import { clock } from "../src/ast/coordinateTransforms/clock";
import { nightingale } from "../src/data/nightingale";

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

    chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const HorizontalBarChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(spread("lake", { dir: "y" }))
      .mark(rect({ w: "count" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const StackedBarChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { dir: "x" }), //
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const GroupedBarChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { dir: "x" }), //
        stack("species", { dir: "x" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const WaffleChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { spacing: 8, dir: "x" }),
        derive((d) => d.flatMap((d) => repeat(d, "count"))),
        derive((d) => _.chunk(d, 5)),
        spread({ spacing: 2, dir: "y" }),
        spread({ spacing: 2, dir: "x" })
      )
      .mark(rect({ w: 8, h: 8, fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const PieChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood, { coord: clock() })
      .flow(stack("species", { dir: "x" }))
      .mark(rect({ w: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        transform: { x: 200, y: 200 },
      });

    return container;
  },
};

export const DonutChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood, { coord: clock() })
      .flow(stack("species", { dir: "x", y: 50, h: 50 }))
      .mark(rect({ w: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        transform: { x: 200, y: 200 },
      });

    return container;
  },
};

export const RoseChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(nightingale, { coord: clock() })
      .flow(
        stack("Month", { dir: "x" }),
        stack("Type", { dir: "y" }),
        /* TODO: push this into the h encoding of rect */
        derive((d) => d.map((d) => ({ ...d, Death: Math.sqrt(d.Death) })))
      )
      .mark(
        /* TODO: remove emX wart */
        rect({ w: (Math.PI * 2) / 12, emX: true, h: "Death", fill: "Type" })
      )
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        transform: { x: 200, y: 200 },
      });

    return container;
  },
};
