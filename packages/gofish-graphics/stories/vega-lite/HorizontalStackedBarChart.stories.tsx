import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, spread, stack, rect, derive } from "../../src/lib";
import { groupBy, sumBy } from "lodash";
import data from "vega-datasets";

const meta: Meta = {
  title: "Vega-Lite/Horizontal Stacked Bar Chart",
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

    // Mirrors: https://vega.github.io/vega-lite/examples/stacked_bar_h.html
    // Barley trial data: total yield per variety stacked by site, displayed as
    // horizontal bars (x = sum(yield), y = variety, color = site).
    // Vega-Lite uses `aggregate: "sum"` on yield; GoFish pre-aggregates with derive().
    Chart(context.loaded.barley as any[])
      .flow(
        derive((d: any[]) => {
          const grouped = groupBy(d, (row) => `${row.variety}||${row.site}`);
          return Object.values(grouped).map((rows: any) => ({
            variety: rows[0].variety,
            site: rows[0].site,
            yield: sumBy(rows, "yield"),
          }));
        }),
        spread("variety", { dir: "y" }),
        stack("site", { dir: "x" })
      )
      .mark(rect({ w: "yield", fill: "site" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
