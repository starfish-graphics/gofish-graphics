import type { Meta, StoryObj } from "@storybook/html";
import { GoFishSolid, gofish } from "../src/ast";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";
import { orderBy } from "../src/lib";

const meta: Meta = {
  title: "Charts/BarChart",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
      defaultValue: 320,
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
      defaultValue: 400,
    },
  },
};
export default meta;

type Args = { w: number; h: number };

export const Vertical: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return rect(catchData, { fill: "lake", h: "count" })
      .spreadX("lake")
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const Horizontal: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return rect(catchData, { fill: "lake", w: "count" })
      .spreadY("lake", { alignment: "start" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};

export const Stacked: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    return rect(catchData, { fill: "species", h: "count" })
    .stackY("species" /* , { w: "count" } */)
    .transform((d) => orderBy(d, "count", "asc"))
    .spreadX("lake", { alignment: "start" })
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });
  },
};




// export const Horizontal: StoryObj<Args> = {
//   args: { w: 420, h: 400 },
//   render: (args) => (
//     <GoFishSolid w={args.w} h={args.h}>
//       {v2ChartBarHorizontal()}

//   ),
// };
