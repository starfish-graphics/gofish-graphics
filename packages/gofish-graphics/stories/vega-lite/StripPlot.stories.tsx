import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, scatter, rect, log } from "../../src/lib";
import data from "vega-datasets";

// Mirrors: https://vega.github.io/vega-lite/examples/tick_strip.html

const meta: Meta = {
  title: "Vega-Lite/Strip Plot",
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
  args: { w: 300, h: 300 },
  loaders: [async () => ({ cars: await data["cars.json"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();

    const cars = (context.loaded.cars as any[]).map(d => ({
      name: d.Name,
      horsepower: d.Horsepower,
      cylinders: Math.round(d.Cylinders),
    }));

    Chart(cars)
      .flow(log("cars before scatter"), scatter("name", { x: "horsepower", y: "cylinders", debug: true }))
      .mark(rect({ w: 1, h: 10, fill: "rgba(31, 119, 180, 0.4)", // semi‑transparent blue
        stroke: "#1f77b4",
        strokeWidth: 1,}))

      .render(container, { w: args.w, h: args.h, axes: true } as any);

    return container;
  },
};
