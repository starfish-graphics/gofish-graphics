import type { Meta, StoryObj } from "@storybook/html";
import * as fontkit from "fontkit";
import { initializeContainer } from "../helper";
import { Coord, For, Polar, Stack, Text } from "../../src/lib";

const meta: Meta = {
  title: "Bluefish/Text Marks",
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

const fontUrl = new URL(
  "../../src/assets/AndaleMono.ttf",
  import.meta.url
).toString();
const fontFamily = "Andale Mono GoFish";
let fontPromise: Promise<any> | null = null;

const loadFont = () => {
  if (!fontPromise) {
    if (!document.getElementById("gofish-text-font")) {
      const style = document.createElement("style");
      style.id = "gofish-text-font";
      style.textContent = `@font-face { font-family: \"${fontFamily}\"; src: url(\"${fontUrl}\"); font-weight: normal; font-style: normal; }`;
      document.head.appendChild(style);
    }
    fontPromise = fetch(fontUrl)
      .then((response) => response.arrayBuffer())
      .then((buffer) => fontkit.create(new Uint8Array(buffer)));
  }
  return fontPromise;
};

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

    loadFont().then((font) => {
      container.innerHTML = "";
      Stack(
        { direction: "y", spacing: 18, alignment: "start" },
        For(labels, (label) =>
          Text({
            text: label.text,
            fill: label.color,
            font,
            fontSize: 28,
            fontFamily,
            textAnchor: "start",
          })
        )
      ).render(container, {
        w: args.w,
        h: args.h,
      });
    });

    return container;
  },
};

export const TextStackHorizontal: StoryObj<Args> = {
  args: { w: 500, h: 240 },
  render: (args: Args) => {
    const container = initializeContainer();

    loadFont().then((font) => {
      container.innerHTML = "";
      Stack(
        { direction: "x", spacing: 18, alignment: "start" },
        For(labels, (label) =>
          Text({
            text: label.text,
            fill: label.color,
            font,
            fontSize: 28,
            fontFamily,
            textAnchor: "start",
          })
        )
      ).render(container, {
        w: args.w,
        h: args.h,
      });
    });

    return container;
  },
};

export const PolarText: StoryObj<Args> = {
  args: { w: 320, h: 320 },
  render: (args: Args) => {
    const container = initializeContainer();

    loadFont().then((font) => {
      container.innerHTML = "";
      const polar = Polar();
      const radialPolar = {
        type: polar.type,
        transform: ([r, theta]: [number, number]) =>
          polar.transform([theta / 10, r * 2]),
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
          font,
          fontSize: 20,
          fontFamily,
          textAnchor: "middle",
        }),
      ]).render(container, {
        w: args.w,
        h: args.h,
      });
    });

    return container;
  },
};
