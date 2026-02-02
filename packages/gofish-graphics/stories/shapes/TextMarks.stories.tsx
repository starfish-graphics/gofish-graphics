import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Coord, Ellipse, For, Polar, Stack, Text } from "../../src/lib";

const meta: Meta = {
  title: "Shapes/Text Marks",
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

const labels = [
  { text: "GoFish", color: "#22577a" },
  { text: "Text", color: "#38a3a5" },
  { text: "Stacky", color: "#57cc99" },
  { text: "Mark", color: "#80ed99" },
];

export const TextStack: StoryObj<Args> = {
  args: { w: 500, h: 240 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    Stack(
      { direction: "y", spacing: 18, alignment: "start" },
      For(labels, (label) =>
        Text({
          text: label.text,
          fill: label.color,
          fontSize: 28,
          fontFamily,
          textAnchor: "start",
          debugBoundingBox: true,
        })
      )
    ).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const TextStackMiddleAlignment: StoryObj<Args> = {
  args: { w: 500, h: 240 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    Stack(
      { direction: "y", spacing: 18, alignment: "middle" },
      For(labels, (label) =>
        Text({
          text: label.text,
          fill: label.color,
          fontSize: 28,
          fontFamily,
          textAnchor: "start",
          debugBoundingBox: true,
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
  args: { w: 500, h: 240 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    Stack(
      { direction: "x", spacing: 18, alignment: "start" },
      For(labels, (label) =>
        Text({
          text: label.text,
          fill: label.color,
          fontSize: 28,
          fontFamily,
          textAnchor: "start",
          debugBoundingBox: true,
        })
      )
    ).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const TextStackWithEllipse: StoryObj<Args> = {
  args: { w: 500, h: 240 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    Stack({ direction: "y", spacing: 60 }, [
      // Text({ text: "Mercury" }),
      Ellipse({
        w: 10,
        h: 10,
        fill: "red",
      }),
      Text({ text: "Mercury" }),
      // Ref("Mercury"),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PolarText: StoryObj<Args> = {
  args: { w: 320, h: 320 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    const polar = Polar();
    const radialPolar = {
      type: polar.type,
      transform: ([r, theta]: [number, number]) => polar.transform([theta, r]),
      domain: [
        { min: 0, max: 120, size: 120 },
        { min: 0, max: Math.PI * 2, size: Math.PI * 2 },
      ],
    };
    Coord({ transform: radialPolar }, [
      Text({
        text: "Polar Text",
        x: 80,
        y: Math.PI / 4,
        fill: "#ff7f50",
        fontSize: 20,
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
