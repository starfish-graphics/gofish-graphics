import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { SpreadX, SpreadY, Stack, Rect, Text, Image, Spread } from "../../src/lib";
import bottleJpg from "../assets/bottle.jpg";
import bottlePhotoPng from "../assets/maja7777-glass-bottle-free-2451180_1280.png";
import flowerPng from "../assets/schwarzenarzisse-isolated-2437759_1280.png";

const meta: Meta = {
  title: "Low Level Syntax/Image Mixed Primitives",
  argTypes: {
    w: {
      control: { type: "number", min: 200, max: 1400, step: 10 },
    },
    h: {
      control: { type: "number", min: 120, max: 800, step: 10 },
    },
  },
};
export default meta;

type Args = { w: number; h: number };

const inlineBadgeSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72" viewBox="0 0 120 72"><rect width="120" height="72" rx="12" fill="#e2e8f0"/><rect x="10" y="12" width="48" height="48" rx="8" fill="#94a3b8"/><rect x="64" y="20" width="44" height="10" rx="5" fill="#0f172a"/><rect x="64" y="36" width="32" height="8" rx="4" fill="#475569"/></svg>'
)}`;

const imageCard = (title: string, subtitle: string, imageNode: ReturnType<typeof Image>) =>
  Spread(
    { direction: "y", spacing: 6, alignment: "start" },
    [
      Text({ text: title, fontSize: 14, fill: "#0f172a" }),
      Rect({ w: 180, h: 2, fill: "#cbd5e1" }),
      imageNode,
      Text({ text: subtitle, fontSize: 12, fill: "#475569" }),
    ]
  );

export const CardsRow: StoryObj<Args> = {
  args: { w: 980, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    SpreadX({ spacing: 28, alignment: "start" }, [
      imageCard("Bottle Icon", "fixed 120x120", Image({ href: bottleJpg, w: 120, h: 120 })),
      imageCard("Bottle Photo", "fixed 170x110", Image({ href: bottlePhotoPng, w: 170, h: 110 })),
      imageCard("Flower", "fixed 120x150", Image({ href: flowerPng, w: 120, h: 150 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const LabeledRows: StoryObj<Args> = {
  args: { w: 820, h: 360 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    SpreadY({ spacing: 16, alignment: "start" }, [
      Spread({ direction: "x", spacing: 12, alignment: "middle" }, [
        Rect({ w: 12, h: 60, fill: "#7dd3fc", rx: 3, ry: 3 }),
        Image({ href: bottleJpg, w: 60, h: 60 }),
        Text({ text: "Square thumbnail with color marker", fontSize: 14, fill: "#0f172a" }),
      ]),
      Spread({ direction: "x", spacing: 12, alignment: "middle" }, [
        Rect({ w: 12, h: 60, fill: "#86efac", rx: 3, ry: 3 }),
        Image({ href: bottlePhotoPng, w: 92, h: 60 }),
        Text({ text: "Wide thumbnail mixed with text", fontSize: 14, fill: "#0f172a" }),
      ]),
      Spread({ direction: "x", spacing: 12, alignment: "middle" }, [
        Rect({ w: 12, h: 60, fill: "#fda4af", rx: 3, ry: 3 }),
        Image({ href: flowerPng, w: 44, h: 60 }),
        Text({ text: "Tall thumbnail with matching row layout", fontSize: 14, fill: "#0f172a" }),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const DataUriWithAssets: StoryObj<Args> = {
  args: { w: 760, h: 260 },
  render: (args: Args) => {
    const container = initializeContainer();

    container.innerHTML = "";
    SpreadX({ spacing: 24, alignment: "start" }, [
      imageCard(
        "Inline SVG",
        "w only (w=120, h inferred)",
        Image({ href: inlineBadgeSvg, w: 120 })
      ),
      imageCard("Asset JPG", "fixed 110x110", Image({ href: bottleJpg, w: 110, h: 110 })),
      imageCard("Asset PNG", "fixed 120x90", Image({ href: bottlePhotoPng, w: 120, h: 90 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};
