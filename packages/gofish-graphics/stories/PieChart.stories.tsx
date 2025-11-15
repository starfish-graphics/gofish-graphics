import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData, catchDataWithLocations } from "../src/data/catch";
import { polar } from "../src/ast/coordinateTransforms/polar";
import { orderBy } from "../src/lib";

export default {
  title: "Charts/PieChart",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
      defaultValue: 320,
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
      defaultValue: 400,
    },
  },
} as Meta;

type Args = { w: number; h: number };

export const Pie: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    rect(catchData, { fill: "species", w: "count", h: 40 })
      .stackX("species")
      .transform((d) => orderBy(d, "count", "asc"))
      .coord(polar())
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
    return container;
  },
};

export const ScatterPie: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    rect(catchDataWithLocations, { fill: "species", w: "count" })
    .stackX("species", { h: 20 })
    .transform((d) => orderBy(d, "count", "asc"))
    .coord(polar())
    .scatter("lake", { x: "x", y: "y" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
    return container;
  },
};