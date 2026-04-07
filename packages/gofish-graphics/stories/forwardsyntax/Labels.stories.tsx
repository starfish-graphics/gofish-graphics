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

// ─── auto ─────────────────────────────────────────────────────────────────────
// Infers the best position based on shape geometry.

export const Auto: StoryObj<Args> = {
  name: "Position: auto",
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

// ─── inside ───────────────────────────────────────────────────────────────────
// Centred within the shape. Auto-contrasts against the fill.

export const Inside: StoryObj<Args> = {
  name: "Position: inside",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        stack("species", { dir: "y" })
      )
      .mark(
        rect({ h: "count", fill: "species" }).label("count", {
          position: "inside",
          fontSize: 10,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── above ────────────────────────────────────────────────────────────────────
// Sits above the top edge of the shape.

export const Above: StoryObj<Args> = {
  name: "Position: above",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count" }).label("count", { position: "above" }))
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── below ────────────────────────────────────────────────────────────────────
// Sits below the bottom edge of each segment. Shown on y-stacked bars so labels
// land inside the chart (at each segment's baseline), away from the x-axis.

export const Below: StoryObj<Args> = {
  name: "Position: below",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "y", spacing: 30 }),
        stack("species", { dir: "x" })
      )
      .mark(
        rect({ w: "count", fill: "species" }).label("count", {
          position: "below",
          fontSize: 9,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: false });
    return container;
  },
};

// ─── left ─────────────────────────────────────────────────────────────────────
// Sits to the left of each segment. Shown on x-stacked horizontal bars so labels
// land inside the chart (at each segment's left edge), away from the y-axis.

export const Left: StoryObj<Args> = {
  name: "Position: left",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "y" }),
        spread("species", { dir: "x", spacing: 25 })
      )
      .mark(
        rect({ w: "count", fill: "species" }).label("count", {
          position: "left",
          fontSize: 9,
          offset: 7
        })
      )
      .render(container, { w: args.w, h: args.h, axes: false });
    return container;
  },
};

// ─── right ────────────────────────────────────────────────────────────────────
// Sits to the right of the shape. Natural for horizontal bars.

export const Right: StoryObj<Args> = {
  name: "Position: right",
  args: { w: 400, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "y" }))
      .mark(rect({ w: "count" }).label("count", { position: "right" }))
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── above-start ──────────────────────────────────────────────────────────────
// Above the bar, label anchored at the left edge (start). Good for x-stacked bars.

export const AboveStart: StoryObj<Args> = {
  name: "Position: above-start",
  args: { w: 500, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        stack("species", { dir: "x" })
      )
      .mark(
        rect({ h: "count", fill: "species" }).label("count", {
          position: "above-start",
          fontSize: 9,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── above-end ────────────────────────────────────────────────────────────────
// Above the bar, label anchored at the right edge (end). Good for x-stacked bars.

export const AboveEnd: StoryObj<Args> = {
  name: "Position: above-end",
  args: { w: 500, h: 300 },
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        stack("species", { dir: "x" })
      )
      .mark(
        rect({ h: "count", fill: "species" }).label("count", {
          position: "above-end",
          fontSize: 9,
        })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── All positions grid ────────────────────────────────────────────────────────
// One row per position so they can be compared side by side.

const ALL_POSITIONS = [
  "auto",
  "inside",
  "above",
  "below",
  "left",
  "right",
  "above-start",
  "above-end",
] as const;

export const AllPositions: StoryObj<{ w: number; h: number }> = {
  name: "All positions – comparison",
  args: { w: 400, h: 180 },
  render: (args) => {
    const outer = document.createElement("div");
    outer.style.display = "flex";
    outer.style.flexDirection = "column";
    outer.style.gap = "4px";
    document.body.appendChild(outer);

    for (const pos of ALL_POSITIONS) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      const label = document.createElement("div");
      label.textContent = pos;
      label.style.width = "130px";
      label.style.fontSize = "12px";
      label.style.fontFamily = "monospace";
      label.style.flexShrink = "0";
      row.appendChild(label);

      const container = document.createElement("div");
      container.style.flex = "1";
      row.appendChild(container);
      outer.appendChild(row);

      Chart(seafood)
        .flow(spread("lake", { dir: "x" }))
        .mark(rect({ h: "count" }).label("count", { position: pos, fontSize: 9 }))
        .render(container, { w: args.w, h: args.h, axes: false });
    }

    return outer;
  },
};

// ─── Label on spread (group label) ────────────────────────────────────────────
// The label is on the spread combinator, not on individual marks.
// Because the spread carries its own datum, resolveLabels keeps the label
// at the group level instead of propagating it down to each child rect.
// Result: one label per lake group, centred above the pair of bars.

export const LabelOnSpread: StoryObj<Args> = {
  name: "Label on spread",
  args: { w: 500, h: 300 },
  // want something like this??
  // render: (args) => {
  //   const container = initializeContainer();
  //   Chart(seafood)
  //     .flow(
  //       spread("lake", { dir: "x" }).label("lake"),
  //       stack("species", { dir: "x" })
  //     )
  //     .mark(
  //       rect({ h: "count", fill: "species" })
  //     )
  //     .render(container, { w: args.w, h: args.h, axes: true });
  //   return container;
  // },

  // // label only works on Mark combinator spread
  // render: (args) => {
  //   const container = initializeContainer();
  //   Chart(seafood)
  //     .flow(spread("lake", { dir: "x" }))
  //     .mark(
  //       // Mark combinator: two bars side-by-side per lake group.
  //       // .label() is on the spread, not on either rect.
  //       spread({ dir: "x", spacing: 4 }, [
  //         rect({ h: "count", fill: "species" }),
  //         rect({ h: "count", fill: "#ccc" }),
  //       ]).label("lake", { position: "above", fontSize: 10 })
  //     )
  //     .render(container, { w: args.w, h: args.h, axes: false });
  //   return container;
  // },

  // hack for label on group
  render: (args) => {
    const container = initializeContainer();
    Chart(seafood)
      .flow(spread("lake", { dir: "x", spacing: 50 }))
      .mark(async (d: any, key) => {
        const node = await Chart(d)
          .flow(stack("species", { dir: "x" }))
          .mark(rect({ h: "count", fill: "species" }))
          .resolve();
        // Stamp datum so resolveLabels keeps the label at group level
        // instead of propagating it down to each species bar
        (node as any).datum = d[0];
        node.label("lake", { position: "above-start", fontSize: 13, offset: 50, rotate: 60 });
        return node;
      })
      .render(container, { w: args.w, h: args.h, axes: false });
    return container;
  }
};

// ─── Heatmap inside ────────────────────────────────────────────────────────────

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
  name: "Heatmap – inside labels (auto-contrast)",
  args: { w: 420, h: 280 },
  render: (args) => {
    const container = initializeContainer();
    Chart(heatData, { color: gradient(["#e0f3ff", "#08519c"]) })
      .flow(table("hour", "day", { spacing: 4 }))
      .mark(
        rect({ fill: "value" }).label("value", { position: "inside", fontSize: 11 })
      )
      .render(container, { w: args.w, h: args.h, axes: true });
    return container;
  },
};

// ─── Rotated labels ────────────────────────────────────────────────────────────
// Labels rotate clockwise for positive values, pivoting at the label's center.

export const Rotated: StoryObj<Args> = {
  name: "Rotate: diagonal labels",
  args: { w: 500, h: 300 },
  render: (args) => {
    const outer = document.createElement("div");
    outer.style.display = "flex";
    outer.style.flexDirection = "column";
    outer.style.gap = "8px";
    document.body.appendChild(outer);

    const cases: { label: string; rotate: number }[] = [
      { label: "rotate: 45°", rotate: 45 },
      { label: "rotate: -30°", rotate: -30 },
      { label: "rotate: 0°", rotate: 0 },
    ];

    for (const { label, rotate } of cases) {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      const tag = document.createElement("div");
      tag.textContent = label;
      tag.style.width = "120px";
      tag.style.fontSize = "12px";
      tag.style.fontFamily = "monospace";
      tag.style.flexShrink = "0";
      row.appendChild(tag);

      const container = document.createElement("div");
      container.style.flex = "1";
      row.appendChild(container);
      outer.appendChild(row);

      Chart(seafood)
        .flow(spread("lake", { dir: "x" }))
        .mark(
          rect({ h: "count" }).label("count", { position: "above", rotate })
        )
        .render(container, { w: args.w, h: args.h, axes: true });
    }

    return outer;
  },
};
