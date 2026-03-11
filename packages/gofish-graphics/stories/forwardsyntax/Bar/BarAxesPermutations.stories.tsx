import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { seafood } from "../../../src/data/catch";
import { Chart, spread, rect } from "../../../src/lib";

const meta: Meta = {
  title: "Forward Syntax V3/Bar/Axes Permutations",
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

type AxesOption = boolean | { x: boolean; y: boolean };
type Args = { w: number; h: number };

function renderBar(args: Args, axes: AxesOption): HTMLElement {
  const container = initializeContainer();

  Chart(seafood)
    .flow(spread("lake", { dir: "x" }))
    .mark(rect({ h: "count" }))
    .render(container, {
      w: args.w,
      h: args.h,
      axes,
    });

  return container;
}

export const AxesTrue: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => renderBar(args, true),
};

export const AxesFalse: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => renderBar(args, false),
};

export const AxesXYTrue: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => renderBar(args, { x: true, y: true }),
};

export const AxesXOnly: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => renderBar(args, { x: true, y: false }),
};

export const AxesYOnly: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => renderBar(args, { x: false, y: true }),
};

export const AxesXYFalse: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => renderBar(args, { x: false, y: false }),
};
