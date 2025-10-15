import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchLocations } from "../src/data/catch";
import { ellipse, Frame, For, orderBy, StackX, v } from "../src/lib";
import { testBoxWhiskerPlot } from "../src/tests/boxwhisker";

const meta: Meta = {
  title: "Charts/LowLevel",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
};
export default meta;

type Args = { w: number; h: number };

export const BoxWhisker: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return testBoxWhiskerPlot().render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
  },
};

export const CompositeVisualization: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    /* TODO: histogram??? */

    // Duplicate catchLocations ten times, jitter x/y randomly for each entry
    const jitterAmount = 10; // Max jitter for x/y
    function jitterCoord(coord: { x: number; y: number }) {
      return {
        x: coord.x + (Math.random() - 0.5) * jitterAmount,
        y: coord.y + (Math.random() - 0.5) * jitterAmount,
      };
    }
    // Create an array of 10 jittered datasets, flatten into one array of coord objects
    const jitteredLocations: { lake: string; x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      for (const [lake, coord] of Object.entries(catchLocations)) {
        jitteredLocations.push({
          lake,
          ...jitterCoord(coord),
        });
      }
    }

    // Stack of a scatterplot and a histogram of the data
    return StackX({ spacing: 20, sharedScale: true }, [
      Frame(
        {},
        For(jitteredLocations, (d) =>
          ellipse({
            x: v(d.x),
            y: v(d.y),
            w: 8,
            h: 8,
            fill: "cornflowerblue",
          })
        )
      ),
      Frame(
        {},
        For(jitteredLocations, (d) =>
          ellipse({
            x: v(d.x),
            y: v(d.y),
            w: 8,
            h: 8,
          })
        )
      ),
      // testHistogram(),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
  },
};
