import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { catchLocationsArray } from "../../src/data/catch";
import { chart, layer, select, line, scaffold } from "../../src/lib";
import { scatter } from "../../src/ast/marks/chart";

const meta: Meta = {
  title: "Forward Syntax V3/Line Chart",
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
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(catchLocationsArray)
        .flow(scatter("lake", { x: "x", y: "y" }))
        .mark(scaffold())
        .as("points"),
      chart(select("points")).mark(line()),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
