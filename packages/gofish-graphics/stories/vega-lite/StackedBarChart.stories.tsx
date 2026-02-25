import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, spread, stack, rect, derive, log } from "../../src/lib";
import { groupBy } from "lodash";
import data from "vega-datasets";
import _ from "lodash";

// Mirrors: https://vega.github.io/vega-lite/examples/stacked_bar_weather.html

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
        derive((d: any[]) =>
          d.map((row) => ({
            month: MONTHS[new Date(row.date).getMonth()],
            ...row,
          }))
        ),
        spread("month", { dir: "x" }),
        derive((d: any[]) => {
          // Enforce specific weather order for stacking
          const WEATHER_ORDER = ["sun", "fog", "drizzle", "rain", "snow"];
          // If d is already grouped into [{month, weather, count}], just sort on weather
          if (d.length && d[0].weather !== undefined) {
            return [...d].sort(
              (a, b) =>
                WEATHER_ORDER.indexOf(a.weather) -
                WEATHER_ORDER.indexOf(b.weather)
            );
          }
          return d;
        }),
        stack("weather", { dir: "y" }),
        log("spread data"),
        // log("spread data"),
        // stack("date", { dir: "y" })
        derive((d) => ({ count: d.length, weather: d[0].weather }))
      )
      .mark(rect({ h: "count", fill: "weather" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
