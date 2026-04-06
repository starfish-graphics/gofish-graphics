import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { seafood } from "../../src/data/catch";
import {
  Chart,
  spread,
  stack,
  table,
  rect,
  circle,
  gradient,
} from "../../src/lib";

const meta: Meta = {
  title: "Forward Syntax V3/Labels",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1000, step: 10 } },
  },
};
export default meta;

type Args = { w: number; h: number };

// ─── Basic vertical bar: field accessor ───────────────────────────────────────

export const BarFieldAccessor: StoryObj<Args> = {
  name: "Bar – field accessor",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count" }).label("count"))
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Function accessor ─────────────────────────────────────────────────────────

export const BarFunctionAccessor: StoryObj<Args> = {
  name: "Bar – function accessor",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(
        rect({ h: "count" }).label((d: any) => {
          const arr = Array.isArray(d) ? d : [d];
          const total = arr.reduce((s: number, row: any) => s + (row.count ?? 0), 0);
          return `n=${total}`;
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Position: above ───────────────────────────────────────────────────────────

export const BarLabelAbove: StoryObj<Args> = {
  name: "Bar – label above",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count" }).label({ accessor: "count", position: "above" }))
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Position: inside ──────────────────────────────────────────────────────────

export const BarLabelInside: StoryObj<Args> = {
  name: "Bar – label inside",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(
        rect({ h: "count" }).label({
          accessor: "count",
          position: "inside",
          fontSize: 12,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Custom font size and color ────────────────────────────────────────────────

export const BarLabelStyled: StoryObj<Args> = {
  name: "Bar – custom font size & color",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(
        rect({ h: "count" }).label({
          accessor: "count",
          position: "above",
          fontSize: 14,
          color: "#e63946",
          offset: 8,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Horizontal bar: label to the right ───────────────────────────────────────

export const HorizontalBarLabel: StoryObj<Args> = {
  name: "Horizontal bar – label right",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "y" }))
      .mark(
        rect({ w: "count" }).label({
          accessor: "count",
          position: "right",
          fontSize: 11,
          color: "#333",
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Grouped bar with per-species labels ──────────────────────────────────────

export const GroupedBarLabel: StoryObj<Args> = {
  name: "Grouped bar – label above each bar",
  args: { w: 500, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        stack("species", { dir: "x" })
      )
      .mark(
        rect({ h: "count", fill: "species" }).label({
          accessor: "count",
          position: "above",
          offset: 4,
          fontSize: 9,
          color: "#444",
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Stacked bar: labels inside each segment ──────────────────────────────────

export const StackedBarLabelInside: StoryObj<Args> = {
  name: "Stacked bar – label inside each segment",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        stack("species", { dir: "y" })
      )
      .mark(
        rect({ h: "count", fill: "species" }).label({
          accessor: "count",
          position: "inside",
          fontSize: 10,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Circle mark with label above ─────────────────────────────────────────────

const topSpeciesPerLake = Object.entries(
  seafood.reduce((acc, row) => {
    const key = row.lake;
    if (!acc[key] || row.count > acc[key].count) acc[key] = row;
    return acc;
  }, {} as Record<string, (typeof seafood)[0]>)
).map(([, row]) => row);

export const CircleLabelAbove: StoryObj<Args> = {
  name: "Circle – label above",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(topSpeciesPerLake)
      .flow(spread("lake", { dir: "x" }))
      .mark(
        circle({ r: 20 }).label({
          accessor: "count",
          position: "above",
          offset: 8,
          fontSize: 12,
          color: "#333",
        })
      )
      .render(container, { w: args.w, h: args.h, axes: false });
    return container;
  },
};

// ─── Heatmap with value labels ─────────────────────────────────────────────────

const heatData = ["Mon", "Tue", "Wed", "Thu", "Fri"].flatMap((day, di) =>
  ["9am", "12pm", "3pm"].map((hour, hi) => ({
    day,
    hour,
    value: [42, 78, 55, 91, 33, 67, 24, 89, 61, 15, 74, 48, 36, 83, 70][
      di * 3 + hi
    ],
  }))
);

export const HeatmapWithLabels: StoryObj<Args> = {
  name: "Heatmap – value labels",
  args: { w: 420, h: 280 },
  render: (args) => {
    const container = initializeContainer();
    Chart(heatData, { color: gradient(["#e0f3ff", "#08519c"]) })
      .flow(table("hour", "day", { spacing: 4 }))
      .mark(
        rect({ fill: "value" }).label({
          accessor: "value",
          position: "inside",
          fontSize: 11,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};
