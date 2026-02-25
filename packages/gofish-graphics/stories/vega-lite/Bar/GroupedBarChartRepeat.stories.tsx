import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import {
  Chart,
  spread,
  stack,
  rect,
  derive,
  Rect,
  Spread,
  SpreadX,
  v,
} from "../../../src/lib";
import { groupBy, sumBy } from "lodash";
import data from "vega-datasets";

// Mirrors: https://vega.github.io/vega-lite/examples/bar_grouped_repeated.html

const meta: Meta = {
  title: "Vega-Lite/Bar/Grouped Bar Chart (Multiple Measure with Repeat)",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};

export default meta;

type Args = { w: number; h: number };

export const Default: StoryObj<Args> = {
  args: { w: 600, h: 300 },
  loaders: [async () => ({ movies: await data["movies.json"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();

    // TODO: you have to drop down all the way to low-level syntax to do this!
    /* maybe it would make more sense to do
    spread({ dir: "x" }, [
      rect({ h: "Worldwide Gross", fill: v("Worldwide Gross") }),
      rect({ h: "US Gross", fill: v("US Gross") })
    )])
    */
    // TODO: the labels run into each other!
    Chart(context.loaded.movies as any[])
      .flow(spread("Major Genre", { dir: "x" }))
      .mark((data) =>
        SpreadX([
          Rect({
            h: v(sumBy(data, "Worldwide Gross")),
            fill: v("Worldwide Gross"),
          }),
          Rect({ h: v(sumBy(data, "US Gross")), fill: v("US Gross") }),
        ])
      )
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
