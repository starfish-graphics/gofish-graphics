import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { seafood } from "../../src/data/catch";
import { chart, spread, rect, stack, derive, layer, select, Text, Ref, Spread, circle } from "../../src/lib";
import { group } from "../../src/ast/marks/chart";
import { barChart } from "../../src/charts/bar";
import { orderBy } from "lodash";

const meta: Meta = {
  title: "Forward Syntax V3/Bar",
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

// Test data for template-based bar charts
const testData = [
  { category: "A", value: 30, color: "#ff6b6b" },
  { category: "B", value: 80, color: "#4ecdc4" },
  { category: "C", value: 45, color: "#45b7d1" },
  { category: "D", value: 60, color: "#f9ca24" },
  { category: "E", value: 20, color: "#6c5ce7" },
];

// === Forward Syntax V3 (chart().flow()) ===

export const Basic: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const Negative: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    const testData = [
      { category: "A", value: -30 },
      { category: "B", value: 80 },
      { category: "C", value: 45 },
      { category: "D", value: 60 },
      { category: "E", value: 20 },
    ];

    chart(testData)
      .flow(spread("category", { dir: "x" }))
      .mark(rect({ h: "value" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const Horizontal: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(spread("lake", { dir: "y" }))
      .mark(rect({ w: "count" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const WithLabels: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(seafood)
        .flow(spread("lake", { dir: "x" }))
        .mark(rect({ h: "count" }))
        .as("bars"),
      chart(select("bars"))
        .flow(group("lake"))
        .mark((d) => {
          console.log(d);
          return Spread({ direction: "y", alignment: "middle", spacing: 10 }, [
            Ref(d[0].__ref!),
            Text({ text: d[0].count }),
          ]);
        }),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const Stacked: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { dir: "x" }), //
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const StackedWithLabels: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { dir: "x" }), //
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species", label: true }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const SortedStacked: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        derive((d) => orderBy(d, "count", "asc")),
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const Grouped: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { dir: "x" }), //
        stack("species", { dir: "x" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

// === Template-based (barChart helper) ===

export const TemplateVertical: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, { x: "category", y: "value" }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateHorizontal: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "value",
      y: "category",
      orientation: "x",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateVerticalWithFillColor: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "category",
      y: "value",
      fill: "#4ecdc4",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateHorizontalWithFillColor: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "value",
      y: "category",
      orientation: "x",
      fill: "#ff6b6b",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateVerticalWithFillField: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "category",
      y: "value",
      fill: "color",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateHorizontalWithFillField: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "value",
      y: "category",
      orientation: "x",
      fill: "color",
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateVerticalWithCustomMark: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "category",
      y: "value",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateHorizontalWithCustomMark: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "value",
      y: "category",
      orientation: "x",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateVerticalWithCustomMarkAndFill: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "category",
      y: "value",
      fill: "#45b7d1",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const TemplateHorizontalWithCustomMarkAndFill: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    barChart(testData, {
      x: "value",
      y: "category",
      orientation: "x",
      fill: "#f9ca24",
      mark: circle,
    }).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};
