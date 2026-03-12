import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { Chart, bin, derive, rect, log, scatter } from "../../../src/lib";
import data from "vega-datasets";

// Mirrors: https://vega.github.io/vega-lite/examples/histogram.html

const meta: Meta = {
  title: "Vega-Lite/Histogram/Histogram",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};

export default meta;

type Args = { w: number; h: number };

export const Default: StoryObj<Args> = {
  args: { w: 500, h: 300 },
  loaders: [async () => ({ movies: await data["movies.json"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();

    // TODO: scatter needs to have the alignment behavior when one of its dimensions is not
    // specified. this will also affect underlying space resolution
    // NOTE: I was tempted to use stack for this but that doesn't make it easy to set the correct
    // starting position! (It will always start at 0.) Scatter is luckily more general for when
    // histograms aren't consisting of contiguous bins. On the other hand, it maybe suggests a 1D
    // binning operator that behaves slightly different from stacking in terms of that
    // functionality.
    Chart(context.loaded.movies as any[])
      .flow(
        derive(bin("IMDB Rating")),
        log("binned data"),
        scatter({ x: "start", y: 0 })
      )
      .mark(rect({ w: "size", h: "count" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
