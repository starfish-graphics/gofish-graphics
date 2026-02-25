import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { Chart, spread, stack, rect, derive } from "../../../src/lib";
import { groupBy, sumBy } from "lodash";
import data from "vega-datasets";

// Mirrors: https://vega.github.io/vega-lite/examples/stacked_bar_h.html

const meta: Meta = {
  title: "Vega-Lite/Bar/Horizontal Stacked Bar Chart",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};

export default meta;

type Args = { w: number; h: number };

export const Default: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  loaders: [async () => ({ barley: await data["barley.json"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();

    Chart(context.loaded.barley as any[])
      .flow(spread("variety", { dir: "y" }), stack("site", { dir: "x" }))
      .mark(rect({ w: "yield", fill: "site" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
