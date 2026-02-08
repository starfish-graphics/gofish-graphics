import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { seafood } from "../../src/data/catch";
import { chart, spread, rect, stack, derive, layer, select } from "../../src/lib";
import { area, group } from "../../src/ast/marks/chart";
import { orderBy } from "lodash";
import { clock } from "../../src/ast/coordinateTransforms/clock";

const meta: Meta = {
  title: "Forward Syntax V3/Ribbon",
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

export const Basic: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          derive((d) => orderBy(d, "count", "asc")),
          stack("species", { dir: "y" })
        )
        .mark(rect({ h: "count", fill: "species" }))
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

export const Polar: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer({ coord: clock() }, [
      chart(seafood)
        .flow(
          spread("lake", {
            dir: "x",
            spacing: (2 * Math.PI) / 6,
            mode: "center",
            y: 50,
            label: false,
          }),
          derive((d) => orderBy(d, "count", "asc")),
          stack("species", { dir: "y", label: false })
        )
        .mark(rect({ w: 0.1, h: "count", fill: "species" }))
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
