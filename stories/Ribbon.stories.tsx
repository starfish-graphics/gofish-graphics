import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { catchData } from "../src/data/catch";
import { polar } from "../src/ast/coordinateTransforms/polar";
import { initializeContainer } from "./helper";
import { orderBy } from "../src/lib";

export default {
  title: "Charts/Ribbon",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
} as Meta;

type Args = { w: number; h: number };

export const Ribbon: StoryObj<Args> = {
  args: { w: 500, h: 500 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      ts: 0.1,
      fill: "species",
      rs: "count",
    })
      .stackR("species")
      .transform((d) => orderBy(d, "count", "asc"))
      .spreadT("lake", {
        r: 50,
        spacing: (2 * Math.PI) / 6,
        mode: "center",
      })
      .connectT("species", { over: "lake", opacity: 0.7 })
      .coord(polar())
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};
