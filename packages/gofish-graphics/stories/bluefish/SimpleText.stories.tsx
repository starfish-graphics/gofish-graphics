import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Coord, For, Polar, Stack, Text } from "../../src/lib";

const meta: Meta = {
  title: "Bluefish/Simple Text",
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

const fontFamily = "Inter, sans-serif";

const samples = [
  { text: "Alpha", color: "#4a6fa5" },
  { text: "Beta", color: "#3e8e7e" },
  { text: "Gamma", color: "#f28f3b" },
  { text: "Delta", color: "#c8553d" },
];

export const TextStackVertical: StoryObj<Args> = {
  args: { w: 360, h: 240 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    Stack(
      { direction: "y", spacing: 14, alignment: "start" },
      For(samples, (sample) =>
        Text({
          text: sample.text,
          fill: sample.color,
          fontSize: 24,
          fontFamily,
          textAnchor: "start",
        })
      )
    ).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const TextStackHorizontal: StoryObj<Args> = {
  args: { w: 520, h: 140 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    Stack(
      { direction: "x", spacing: 20, alignment: "start" },
      For(samples, (sample) =>
        Text({
          text: sample.text,
          fill: sample.color,
          fontSize: 24,
          fontFamily,
          textAnchor: "start",
        })
      )
    ).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PolarMappedText: StoryObj<Args> = {
  args: { w: 320, h: 320 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    const polar = Polar();
    const radialPolar = {
      type: polar.type,
      transform: ([r, theta]: [number, number]) => polar.transform([theta, r]),
      domain: [
        { min: 0, max: 140, size: 140 },
        { min: 0, max: Math.PI * 2, size: Math.PI * 2 },
      ],
    };

    Coord({ transform: radialPolar }, [
      Text({
        text: "Polar Text",
        x: 90,
        y: Math.PI / 3,
        fill: "#6a4c93",
        fontSize: 22,
        fontFamily,
        textAnchor: "middle",
      }),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};
