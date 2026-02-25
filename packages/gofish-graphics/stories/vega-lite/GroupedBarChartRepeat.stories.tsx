import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, spread, stack, rect, derive } from "../../src/lib";
import { groupBy, sumBy } from "lodash";
import data from "vega-datasets";

const meta: Meta = {
  title: "Vega-Lite/Grouped Bar Chart (Multiple Measure with Repeat)",
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

    // Mirrors: https://vega.github.io/vega-lite/examples/bar_grouped_repeated.html
    // Vega-Lite uses `repeat: { layer: ["Worldwide Gross", "US Gross"] }` to create
    // side-by-side bars for multiple measures within each genre category.
    //
    // MISSING FEATURE: GoFish has no built-in repeat.layer / wide-to-long pivot operator.
    // Equivalent approach: manually reshape wide-format data to long-format in derive(),
    // then use spread + stack for the grouped layout.
    Chart(context.loaded.movies as any[])
      .flow(
        derive((d: any[]) => {
          const filtered = d.filter(
            (row) =>
              row["Major Genre"] != null &&
              row["Worldwide Gross"] != null &&
              row["US Gross"] != null
          );
          const byGenre = groupBy(filtered, "Major Genre");
          return Object.entries(byGenre).flatMap(([genre, rows]) => [
            {
              genre,
              measure: "Worldwide Gross",
              value: sumBy(rows as any[], "Worldwide Gross"),
            },
            {
              genre,
              measure: "US Gross",
              value: sumBy(rows as any[], "US Gross"),
            },
          ]);
        }),
        spread("genre", { dir: "x" }),
        stack("measure", { dir: "x" })
      )
      .mark(rect({ h: "value", fill: "measure" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
