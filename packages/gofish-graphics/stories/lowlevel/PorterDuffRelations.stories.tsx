import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import bottlePng from "../assets/wilsonblanco.png";
import { Atop, Image, In, Mask as MaskOp, Out, Over, Rect, Xor } from "../../src/lib";

const meta: Meta = {
  title: "Low Level Syntax/Porter-Duff Relations",
  argTypes: {
    w: {
      control: { type: "number", min: 320, max: 1600, step: 10 },
    },
    h: {
      control: { type: "number", min: 180, max: 1000, step: 10 },
    },
  },
};

export default meta;

type Args = {
  w: number;
  h: number;
  splitY: number;
  bgColor: string;
  blendMode: "color" | "multiply" | "screen" | "overlay";
};

const DEFAULT_ARGS: Args = {
  w: 193,
  h: 678,
  splitY: 50,
  bgColor: "#1c7520",
  blendMode: "color",
};

const buildChildren = (args: Args) => {
  const splitY = args.h - args.h * (args.splitY / 100);
  const splitH = args.h * (args.splitY / 100);
  return [
    Image({ href: bottlePng, x: 0, y: 0, w: args.w, h: args.h }),
    Rect({ x: 0, y: splitY, w: args.w, h: splitH, fill: args.bgColor }),
  ];
};

const renderComposite = (
  args: Args,
  relation: (options: { blendMode?: Args["blendMode"] }, children: ReturnType<typeof buildChildren>) => any
) => {
  const container = initializeContainer();
  container.innerHTML = "";
  relation({ blendMode: args.blendMode }, buildChildren(args)).render(container, {
    w: args.w,
    h: args.h,
  });
  return container;
};

const renderMask = (args: Args) => {
  const container = initializeContainer();
  container.innerHTML = "";
  MaskOp(buildChildren(args)).render(container, {
    w: args.w,
    h: args.h,
  });
  return container;
};

export const Union: StoryObj<Args> = {
  name: "Union (over)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderComposite(args, Over),
};

export const Intersect: StoryObj<Args> = {
  name: "Intersect (in)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderComposite(args, In),
};

export const Exclude: StoryObj<Args> = {
  name: "Exclude (xor)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderComposite(args, Xor),
};

export const Subtract: StoryObj<Args> = {
  name: "Subtract (out)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderComposite(args, Out),
};

export const Paint: StoryObj<Args> = {
  name: "Paint (atop)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderComposite(args, Atop),
};

export const Mask: StoryObj<Args> = {
  name: "Mask (none)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderMask(args),
};
