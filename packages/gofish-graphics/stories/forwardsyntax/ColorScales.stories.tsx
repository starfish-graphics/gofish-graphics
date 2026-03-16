import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { seafood } from "../../src/data/catch";
import { Chart, spread, stack, rect, derive } from "../../src/lib";

const meta: Meta = {
  title: "Forward Syntax V3/Color Scales",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};
export default meta;

type Args = { w: number; h: number };
const defaultArgs = { w: 400, h: 400 };

// Numeric dataset: one value per item, suitable for continuous color demos
const scores = [
  { label: "A", value: 4 },
  { label: "B", value: 12 },
  { label: "C", value: 28 },
  { label: "D", value: 47 },
  { label: "E", value: 63 },
  { label: "F", value: 81 },
  { label: "G", value: 90 },
  { label: "H", value: 100 }
];

// Discrete — named scheme (tableau10), colors cycle by species
export const DiscreteNamedScheme: StoryObj<Args> = {
  name: "Discrete / Named Scheme",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(seafood, { color: "tableau10" })
      .flow(spread("species", { dir: "x" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Discrete — explicit string[] palette, colors cycle by species
export const DiscreteStringArray: StoryObj<Args> = {
  name: "Discrete / String Array",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(seafood, { color: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"] })
      .flow(spread("species", { dir: "x" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Continuous — named scheme (blues), interpolates by numeric value
export const ContinuousNamedScheme: StoryObj<Args> = {
  name: "Continuous / Named Scheme",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(scores, { color: "blues" })
      .flow(spread("label", { dir: "x" }))
      .mark(rect({ h: "value", fill: "value" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Paired bars — warm continuous palette for bar 1, cold for bar 2 within each pair
const pairedBars = [
  { pair: "P1", type: "warm", value: 20, barColor: "#ffe8cc" },
  { pair: "P1", type: "cold", value: 20, barColor: "#cce5ff" },
  { pair: "P2", type: "warm", value: 45, barColor: "#ffb347" },
  { pair: "P2", type: "cold", value: 45, barColor: "#6baed6" },
  { pair: "P3", type: "warm", value: 70, barColor: "#ff6f00" },
  { pair: "P3", type: "cold", value: 70, barColor: "#2171b5" },
  { pair: "P4", type: "warm", value: 90, barColor: "#d32f2f" },
  { pair: "P4", type: "cold", value: 90, barColor: "#08306b" },
];

export const PairedPalettes: StoryObj<Args> = {
  name: "Paired / Warm + Cold Palettes",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(pairedBars)
      .flow(
        spread("pair", { dir: "x" }),
        stack("type", { dir: "x" })
      )
      .mark(rect({ h: "value", fill: "barColor" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Nested derive — first half of lakes colored, Salmon highlighted within those
export const NestedDerive: StoryObj<Args> = {
  name: "Selective / Nested Derive",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    const lakeOrder = ["Lake A", "Lake B", "Lake C", "Lake D", "Lake E", "Lake F"];

    Chart(seafood, {
      color: {
        "salmon-highlight": "#e15759",
        "first-half": "#4e79a7"      
      },
    })
      .flow(
        derive((d) =>
          d.map((item) => {
            const isFirstHalf = lakeOrder.indexOf(item.lake) < 3;
            const isSalmon = item.species === "Salmon";
            return {
              ...item,
              highlight:
                isFirstHalf && isSalmon
                  ? "salmon-highlight"
                  : isFirstHalf
                    ? "first-half"
                    : "",
            };
          })
        ),
        spread("lake", { dir: "x" }),
        stack("species", { dir: "x" })
      )
      .mark(rect({ h: "count", fill: "highlight" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Selective via derive — compute a highlight field, color only matching rows
export const SelectiveDerive: StoryObj<Args> = {
  name: "Selective / Derive Highlight",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(seafood, { color: { highlighted: "#e15759" } })
      .flow(
        derive((d) =>
          d.map((item) => ({
            ...item,
            highlight: item.species === "Salmon" ? "highlighted" : ""
          }))
        ),
        spread("lake", { dir: "x" }),
        stack("species", { dir: "x" })
      )
      .mark(rect({ h: "count", fill: "highlight" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Selective — only the mapped species is colored; others fall back to "#ccc"
export const SelectiveGroup: StoryObj<Args> = {
  name: "Selective / Highlight Group",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(seafood, { color: { Salmon: "#e15759" } })
      .flow(
        spread("lake", { dir: "x" }),
        stack("species", { dir: "x" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};

// Continuous — explicit string[] color stops, interpolates by numeric value
export const ContinuousStringArray: StoryObj<Args> = {
  name: "Continuous / String Array",
  args: defaultArgs,
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(scores, { color: ["#f7fbff", "#42c663", "#6b0808"] })
      .flow(spread("label", { dir: "x" }))
      .mark(rect({ h: "value", fill: "value" }))
      .render(container, { w: args.w, h: args.h, axes: true });

    return container;
  },
};
