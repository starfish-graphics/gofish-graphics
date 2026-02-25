import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, spread, rect, derive } from "../../src/lib";
import { groupBy, sumBy, orderBy } from "lodash";
import data from "vega-datasets";

const meta: Meta = {
  title: "Vega-Lite/Aggregate Bar Chart (Sorted)",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};

export default meta;

type Args = { w: number; h: number };

export const Default: StoryObj<Args> = {
  args: { w: 500, h: 300 },
  loaders: [async () => ({ population: await data["population.json"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();
    const year2000 = (context.loaded.population as any[]).filter(
      (d) => d.year === 2000
    );

    // Mirrors: https://vega.github.io/vega-lite/examples/bar_aggregate_sort_by_encoding.html
    // Same population data, but age groups are sorted by descending population total.
    // Vega-Lite uses `sort: "-x"` on the y-axis encoding.
    // GoFish equivalent: orderBy() the aggregated data before spreading.
    Chart(year2000)
      .flow(
        derive((d: any[]) => {
          const grouped = groupBy(d, "age");
          const aggregated = Object.entries(grouped).map(([age, rows]) => ({
            age: `${age}`,
            people: sumBy(rows as any[], "people"),
          }));
          return orderBy(aggregated, "people", "desc");
        }),
        spread("age", { dir: "y" })
      )
      .mark(rect({ w: "people" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
