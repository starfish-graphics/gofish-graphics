import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Constraint, Layer, Rect, Spread } from "../../src/lib";

const meta: Meta = {
  title: "Low Level Syntax/Constraints",
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

type EquivalentRenderer = (container: HTMLElement, args: Args) => void;

const renderPanel = (title: string, mount: HTMLElement) => {
  const panel = document.createElement("section");
  panel.style.border = "1px solid #d8d8d8";
  panel.style.borderRadius = "8px";
  panel.style.padding = "10px";
  panel.style.background = "#fff";

  const heading = document.createElement("h4");
  heading.textContent = title;
  heading.style.margin = "0 0 8px 0";
  heading.style.fontFamily = "Space Grotesk, sans-serif";
  heading.style.fontWeight = "500";
  panel.appendChild(heading);

  panel.appendChild(mount);
  return panel;
};

const renderEquivalentStory = (
  args: Args,
  spreadRenderer: EquivalentRenderer,
  constraintRenderer: EquivalentRenderer
) => {
  const host = document.createElement("div");
  host.style.padding = "20px";

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))";
  grid.style.gap = "12px";
  host.appendChild(grid);

  const spreadMount = document.createElement("div");
  const constraintMount = document.createElement("div");

  spreadRenderer(spreadMount, args);
  constraintRenderer(constraintMount, args);

  grid.appendChild(renderPanel("Spread", spreadMount));
  grid.appendChild(renderPanel("Constraints", constraintMount));

  return host;
};

const makeYRects = () => [
  Rect({ w: 80, h: 40, fill: "#e63946" }).name("a"),
  Rect({ w: 120, h: 40, fill: "#457b9d" }).name("b"),
  Rect({ w: 60, h: 40, fill: "#2a9d8f" }).name("c"),
];

const makeXRects = () => [
  Rect({ w: 40, h: 80, fill: "#e63946" }).name("a"),
  Rect({ w: 40, h: 120, fill: "#457b9d" }).name("b"),
  Rect({ w: 40, h: 60, fill: "#2a9d8f" }).name("c"),
];

const makeCenterToCenterRects = () => [
  Rect({ w: 30, h: 80, fill: "#e63946" }).name("a"),
  Rect({ w: 50, h: 80, fill: "#457b9d" }).name("b"),
  Rect({ w: 20, h: 80, fill: "#2a9d8f" }).name("c"),
];

// ──────────────────────────────────────────────────────────
// Equivalence: Spread = align + distribute
// ──────────────────────────────────────────────────────────

/**
 * Spread({ direction: "y", alignment: "start" })
 *   ≡ align({ dir: "x", alignment: "start" }) + distribute({ dir: "y" })
 *
 * Three rects of different widths, stacked vertically, left-aligned.
 */
export const SpreadY_AlignStart: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread({ direction: "y", alignment: "start" }, makeYRects()).render(
          container,
          {
            w: storyArgs.w,
            h: storyArgs.h,
          }
        );
      },
      (container, storyArgs) => {
        Layer(makeYRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "x", alignment: "start" }, [a, b, c]),
            Constraint.distribute({ dir: "y" }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

/**
 * Spread({ direction: "y", alignment: "end" })
 *   ≡ align({ dir: "x", alignment: "end" }) + distribute({ dir: "y" })
 *
 * Three rects of different widths, stacked vertically, right-aligned.
 */
export const SpreadY_AlignEnd: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread({ direction: "y", alignment: "end" }, makeYRects()).render(
          container,
          {
            w: storyArgs.w,
            h: storyArgs.h,
          }
        );
      },
      (container, storyArgs) => {
        Layer(makeYRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "x", alignment: "end" }, [a, b, c]),
            Constraint.distribute({ dir: "y" }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

/**
 * Spread({ direction: "y", alignment: "middle" })
 *   ≡ align({ dir: "x", alignment: "middle" }) + distribute({ dir: "y" })
 *
 * Three rects of different widths, stacked vertically, center-aligned.
 *
 * TODO: Revisit center baseline semantics so this equivalence does not
 * require pinning a child first. Today, spread middle defaults to viewport
 * center while constraint align-center defaults to 0 when no child is placed.
 */
export const SpreadY_AlignMiddle: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread({ direction: "y", alignment: "middle" }, makeYRects()).render(
          container,
          {
            w: storyArgs.w,
            h: storyArgs.h,
          }
        );
      },
      (container, storyArgs) => {
        Layer([
          // Pin one child to the canvas center so align({ dir: "x", alignment: "middle" })
          // and Spread(... alignment: "middle") share the same baseline.
          Rect({
            x: storyArgs.w / 2 - 80 / 2,
            w: 80,
            h: 40,
            fill: "#e63946",
          }).name("a"),
          Rect({ w: 120, h: 40, fill: "#457b9d" }).name("b"),
          Rect({ w: 60, h: 40, fill: "#2a9d8f" }).name("c"),
        ])
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "x", alignment: "middle" }, [a, b, c]),
            Constraint.distribute({ dir: "y" }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

/**
 * Spread({ direction: "x", alignment: "start" })
 *   ≡ align({ dir: "y", alignment: "start" }) + distribute({ dir: "x" })
 *
 * Three rects of different heights, spread horizontally, bottom-aligned.
 */
export const SpreadX_AlignStart: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread({ direction: "x", alignment: "start" }, makeXRects()).render(
          container,
          {
            w: storyArgs.w,
            h: storyArgs.h,
          }
        );
      },
      (container, storyArgs) => {
        Layer(makeXRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "y", alignment: "start" }, [a, b, c]),
            Constraint.distribute({ dir: "x" }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

// ──────────────────────────────────────────────────────────
// Spacing
// ──────────────────────────────────────────────────────────

/**
 * Spread({ direction: "y", alignment: "start", spacing: 20 })
 *   ≡ align({ dir: "x", alignment: "start" }) + distribute({ dir: "y", spacing: 20 })
 */
export const SpreadY_Spacing: StoryObj<Args> = {
  args: { w: 300, h: 400 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread(
          { direction: "y", alignment: "start", spacing: 20 },
          makeYRects()
        ).render(container, {
          w: storyArgs.w,
          h: storyArgs.h,
        });
      },
      (container, storyArgs) => {
        Layer(makeYRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "x", alignment: "start" }, [a, b, c]),
            Constraint.distribute({ dir: "y", spacing: 20 }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

/**
 * Spread({ direction: "x", alignment: "end", spacing: 15 })
 *   ≡ align({ dir: "y", alignment: "end" }) + distribute({ dir: "x", spacing: 15 })
 */
export const SpreadX_Spacing_AlignEnd: StoryObj<Args> = {
  args: { w: 400, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread(
          { direction: "x", alignment: "end", spacing: 15 },
          makeXRects()
        ).render(container, {
          w: storyArgs.w,
          h: storyArgs.h,
        });
      },
      (container, storyArgs) => {
        Layer(makeXRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "y", alignment: "end" }, [a, b, c]),
            Constraint.distribute({ dir: "x", spacing: 15 }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

// ──────────────────────────────────────────────────────────
// Center-to-center mode
// ──────────────────────────────────────────────────────────

/**
 * Spread({ direction: "x", alignment: "start", spacing: 60, mode: "center-to-center" })
 *   ≡ align({ dir: "y", alignment: "start" }) + distribute({ dir: "x", spacing: 60, mode: "center-to-center" })
 */
export const SpreadX_CenterToCenter: StoryObj<Args> = {
  args: { w: 400, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread(
          {
            direction: "x",
            alignment: "start",
            spacing: 60,
            mode: "center-to-center",
          },
          makeCenterToCenterRects()
        ).render(container, { w: storyArgs.w, h: storyArgs.h });
      },
      (container, storyArgs) => {
        Layer(makeCenterToCenterRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "y", alignment: "start" }, [a, b, c]),
            Constraint.distribute(
              { dir: "x", spacing: 60, mode: "center-to-center" },
              [a, b, c]
            ),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

// ──────────────────────────────────────────────────────────
// Reverse order
// ──────────────────────────────────────────────────────────

/**
 * Spread({ direction: "y", alignment: "start", dir: "ttb" })
 *   ≡ align({ dir: "x", alignment: "start" }) + distribute({ dir: "y", order: "reverse" })
 *
 * dir: "ttb" reverses the children array in spread; order: "reverse" does the same.
 */
export const SpreadY_Reversed: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) =>
    renderEquivalentStory(
      args,
      (container, storyArgs) => {
        Spread(
          { direction: "y", alignment: "start", dir: "ttb" },
          makeYRects()
        ).render(container, {
          w: storyArgs.w,
          h: storyArgs.h,
        });
      },
      (container, storyArgs) => {
        Layer(makeYRects())
          .constrain(({ a, b, c }) => [
            Constraint.align({ dir: "x", alignment: "start" }, [a, b, c]),
            Constraint.distribute({ dir: "y", order: "reverse" }, [a, b, c]),
          ])
          .render(container, { w: storyArgs.w, h: storyArgs.h });
      }
    ),
};

// ──────────────────────────────────────────────────────────
// Partial placement: align only (one axis)
// ──────────────────────────────────────────────────────────

/**
 * Only an align constraint on the x-axis. Children share a right edge
 * but are NOT distributed vertically — they all default to y=0 (overlap).
 */
export const AlignOnly: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ w: 80, h: 40, fill: "#e63946" }).name("a"),
      Rect({ w: 120, h: 60, fill: "#457b9d" }).name("b"),
      Rect({ w: 60, h: 30, fill: "#2a9d8f" }).name("c"),
    ])
      .constrain(({ a, b, c }) => [
        Constraint.align({ dir: "x", alignment: "end" }, [a, b, c]),
      ])
      .render(container, { w: args.w, h: args.h });
    return container;
  },
};

/**
 * Same as AlignOnly, but children are manually placed on y.
 * Useful for making x-alignment behavior obvious without distribution.
 */
export const AlignOnly_ManualY: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ w: 80, h: 40, y: 20, fill: "#e63946" }).name("a"),
      Rect({ w: 120, h: 60, y: 100, fill: "#457b9d" }).name("b"),
      Rect({ w: 60, h: 30, y: 200, fill: "#2a9d8f" }).name("c"),
    ])
      .constrain(({ a, b, c }) => [
        Constraint.align({ dir: "x", alignment: "end" }, [a, b, c]),
      ])
      .render(container, { w: args.w, h: args.h });
    return container;
  },
};

/**
 * Only a distribute constraint on the y-axis. Children are spaced vertically
 * but NOT aligned horizontally — they all default to x=0.
 */
export const DistributeOnly: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ w: 80, h: 40, fill: "#e63946" }).name("a"),
      Rect({ w: 120, h: 40, fill: "#457b9d" }).name("b"),
      Rect({ w: 60, h: 40, fill: "#2a9d8f" }).name("c"),
    ])
      .constrain(({ a, b, c }) => [
        Constraint.distribute({ dir: "y", spacing: 10 }, [a, b, c]),
      ])
      .render(container, { w: args.w, h: args.h });
    return container;
  },
};

// ──────────────────────────────────────────────────────────
// Subset selection
// ──────────────────────────────────────────────────────────

/**
 * Different constraints on different subsets of children.
 * - "a" and "b" are distributed vertically with spacing
 * - "c" and "d" are distributed vertically with different spacing
 * - All four are aligned on the right edge
 *
 * This is impossible with a single Spread — it would require nesting.
 */
export const SubsetSelection: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ w: 100, h: 50, fill: "#e63946" }).name("a"),
      Rect({ w: 80, h: 50, fill: "#457b9d" }).name("b"),
      Rect({ w: 120, h: 50, fill: "#2a9d8f" }).name("c"),
      Rect({ w: 60, h: 50, fill: "#f4a261" }).name("d"),
    ])
      .constrain(({ a, b, c, d }) => [
        Constraint.align({ dir: "x", alignment: "end" }, [a, b, c, d]),
        Constraint.distribute({ dir: "y", spacing: 5 }, [a, b]),
        Constraint.distribute({ dir: "y", spacing: 30 }, [c, d]),
      ])
      .render(container, { w: args.w, h: args.h });
    return container;
  },
};

/**
 * A background rect participates in alignment but NOT distribution.
 * The content rects are distributed vertically and aligned with the background.
 */
export const BackgroundNotDistributed: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ w: 150, h: 200, fill: "#e2ebf6" }).name("bg"),
      Rect({ w: 100, h: 40, fill: "#e63946" }).name("a"),
      Rect({ w: 80, h: 40, fill: "#457b9d" }).name("b"),
      Rect({ w: 120, h: 40, fill: "#2a9d8f" }).name("c"),
    ])
      .constrain(({ bg, a, b, c }) => [
        Constraint.align({ dir: "x", alignment: "start" }, [bg, a, b, c]),
        Constraint.distribute({ dir: "y", spacing: 10 }, [a, b, c]),
      ])
      .render(container, { w: args.w, h: args.h });
    return container;
  },
};

// ──────────────────────────────────────────────────────────
// Cross-axis constraints
// ──────────────────────────────────────────────────────────

/**
 * Align on both axes independently with different anchors.
 * All children share a center on x and are distributed on y.
 */
export const AlignCenterDistributeY: StoryObj<Args> = {
  args: { w: 300, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ w: 80, h: 40, fill: "#e63946" }).name("a"),
      Rect({ w: 120, h: 60, fill: "#457b9d" }).name("b"),
      Rect({ w: 40, h: 30, fill: "#2a9d8f" }).name("c"),
      Rect({ w: 100, h: 50, fill: "#f4a261" }).name("d"),
    ])
      .constrain(({ a, b, c, d }) => [
        Constraint.align({ dir: "x", alignment: "middle" }, [a, b, c, d]),
        Constraint.distribute({ dir: "y", spacing: 8 }, [a, b, c, d]),
      ])
      .render(container, { w: args.w, h: args.h });
    return container;
  },
};
