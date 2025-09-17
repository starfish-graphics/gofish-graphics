import type { Meta, StoryObj } from "@storybook/solid";
import { GoFishSolid } from "../src/ast";
import { v2ChartBar, v2ChartBarHorizontal } from "../src/tests/chartAPITestV2";

const meta: Meta = {
  title: "Charts/BarChart",
  component: GoFishSolid,
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
  render: (args) => (
    <GoFishSolid w={args.w} h={args.h}>
      {v2ChartBar()}
    </GoFishSolid>
  ),
};

export const Horizontal: StoryObj<Args> = {
  args: { w: 420, h: 400 },
  render: (args) => (
    <GoFishSolid w={args.w} h={args.h}>
      {v2ChartBarHorizontal()}
    </GoFishSolid>
  ),
};
