import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, scatter, rect, log } from "../../src/lib";
import seedrandom from "seedrandom";
import data from "vega-datasets";

// Mirrors: https://vega.github.io/vega-lite/examples/tick_dot.html

const meta: Meta = {
  title: "Vega-Lite/1D Strip Plot",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
};

export default meta;

type Args = { w: number; h: number };

export const Default: StoryObj<Args> = {
  args: { w: 300, h: 0 },
  loaders: [async () => ({ weather: await data["seattle-weather.csv"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();

    const rng = seedrandom("gofish");
    const weather = (context.loaded.weather as any[]).map(d => ({
      date: d.date,
      precipitation: d.precipitation,
      stripY: rng() * 0.2,
    }));

    Chart(weather)
      .flow(log("weather before scatter"), scatter("date", { x: "precipitation", y: "stripY", debug: true }))
      .mark(rect({ w: 1, h: 10, fill: "rgba(31, 119, 180, 0.4)", // semi‑transparent blue
        stroke: "#1f77b4",
        strokeWidth: 1,}))

      .render(container, { w: args.w, h: args.h, axes: true } as any);

    return container;
  },
};
