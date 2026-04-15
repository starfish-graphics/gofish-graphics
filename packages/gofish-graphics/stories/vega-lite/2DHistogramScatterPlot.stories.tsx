import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, circle, scatter, log, rect } from "../../src/lib";
import data from "vega-datasets";
import { uniq } from "lodash";

const meta: Meta = {
  title: "Vega-Lite/2D Histogram Scatter Plot",
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
    const moviesRaw = context.loaded.movies as any[];
  
    const xbinSize =
      (Math.max(...moviesRaw.map((d) => d["IMDB Rating"])) -
        Math.min(...moviesRaw.map((d) => d["IMDB Rating"]))) /
        10 || 1;
    const ybinSize = (Math.max(...moviesRaw.map((d) => d["Rotten Tomatoes Rating"])) - Math.min(...moviesRaw.map((d) => d["Rotten Tomatoes Rating"]))) / 10 || 1;
    let movies = moviesRaw
        .filter((d) => d["IMDB Rating"] != null && d["Rotten Tomatoes Rating"] != null)
        .map((d) => ({
      x: Math.floor(d["IMDB Rating"] / xbinSize) * xbinSize,
      y: Math.floor(d["Rotten Tomatoes Rating"] / ybinSize) * ybinSize,
    }));

    const xs = uniq(movies.map((d) => d.x));
    const ys = uniq(movies.map((d) => d.y));

    // Build a flat list of (x, y) bin coordinates.
    const coords = xs.flatMap((x) => ys.map((y) => [x, y] as const));

    const movieCounts = coords.map(([x, y]) => ({
      x,
      y,
      count: movies.filter((d) => d.x === x && d.y === y).length / movies.length,
    })).filter((d) => d.count > 0).map((d, i) => ({ ...d, id: i }));
    

    Chart(movieCounts) 
      .flow(log("scatter locations"), scatter("id", { x: "x", y: "y", debug: true}))
      // Draw a heatmap-like cell per bin (fill encodes count).
      .mark(rect({ w: "count", h: "count", fill: "black", stroke: "black", strokeWidth: 1 } as any))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  }
};
