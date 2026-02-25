import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, spread, stack, rect, derive } from "../../src/lib";
import { groupBy } from "lodash";
import data from "vega-datasets";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const meta: Meta = {
  title: "Vega-Lite/Stacked Bar Chart",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};

export default meta;

type Args = { w: number; h: number };

export const Default: StoryObj<Args> = {
  args: { w: 600, h: 300 },
  loaders: [async () => ({ weather: await data["seattle-weather.csv"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();

    // Mirrors: https://vega.github.io/vega-lite/examples/stacked_bar_weather.html
    // Seattle weather data: count of days per weather type per month.
    // Vega-Lite uses `timeUnit: "month"` and `aggregate: "count"` declaratively.
    // GoFish equivalent: use derive() to extract month from date, then group and count.
    //
    // MISSING FEATURE: Custom color palettes per field value are not yet supported.
    // Vega-Lite maps weather types to specific colors (sun → "#e7ba52", fog → "#c7c7c7",
    // drizzle → "#aec7e8", rain → "#1f77b4", snow → "#9467bd").
    // GoFish assigns colors automatically from its default palette.

    // TODO: need a better way of aggregating by count or whatever.
    Chart(context.loaded.weather as any[])
      .flow(
        derive((d: any[]) => {
          // vega-datasets parses date strings to Date objects via autoType
          const withMonth = d.map((row) => ({
            month: MONTHS[new Date(row.date).getMonth()],
            weather: row.weather,
          }));
          // Aggregate: count occurrences per month × weather, preserving month order
          const result: { month: string; weather: string; count: number }[] =
            [];
          const byMonth = groupBy(withMonth, "month");
          for (const month of MONTHS) {
            if (!byMonth[month]) continue;
            const byWeather = groupBy(byMonth[month], "weather");
            for (const [weather, rows] of Object.entries(byWeather)) {
              result.push({ month, weather, count: (rows as any[]).length });
            }
          }
          return result;
        }),
        spread("month", { dir: "x" }),
        stack("weather", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "weather" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
