import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { seafood } from "../../src/data/catch";
import { chart, spread, scaffold, stack, layer, select } from "../../src/lib";
import { area, group } from "../../src/ast/marks/chart";

const meta: Meta = {
  title: "Forward Syntax V3/Streamgraph",
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
      chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64, alignment: "middle" }),
          stack("species", { dir: "y" })
        )
        .mark(scaffold({ h: "count", fill: "species" }))
        .as("bars"),
      chart(select("bars"))
        .flow(group("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
