import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { seafood } from "../../src/data/catch";
import { Chart, spread, rect } from "../../src/lib";
import { drivingShifts } from "../../src/data/drivingShifts";
import { scatter, circle } from "../../src/ast/marks/chart";

const meta: Meta = {
  title: "Forward Syntax V3/Faceted Chart",
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

export const Default: StoryObj<Args> = {
  args: { w: 600, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(seafood)
      .flow(spread("lake", { dir: "x", spacing: 48 }))
      .mark((data) => 
        Chart(data)
          .flow(spread("species", { dir: "x" }))
          .mark(rect({ h: "count", w: 20 }))
      )
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const FacetedScatterDriving: StoryObj<Args> = {
  args: { w: 800, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(drivingShifts)
      .flow(spread("side", { dir: "x", spacing: 50 }))
      .mark((data) =>
        Chart(data)
          .flow(scatter("year", { x: "year", y: "miles" }))
          .mark(circle({ r: 3, fill: "#4682b4" }))
      )
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        debug: true,
      });

    return container;
  },
};
