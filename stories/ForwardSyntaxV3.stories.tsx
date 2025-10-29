import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "./helper";
import {
  catchLocations,
  catchLocationsArray,
  seafood,
  catchDataWithLocations,
} from "../src/data/catch";
import {
  chart,
  spread,
  rectForward as rect,
  stackForward as stack,
  derive,
  layer,
  select,
  line,
  scaffold,
} from "../src/lib";
import {
  area,
  circle,
  foreach,
  log,
  normalize,
  repeat,
  scatter,
} from "../src/ast/marks/chart-forward-v3";
import _, { groupBy, orderBy } from "lodash";
import { clock } from "../src/ast/coordinateTransforms/clock";
import { nightingale } from "../src/data/nightingale";
import { drivingShifts } from "../src/data/drivingShifts";

const meta: Meta = {
  title: "Forward Syntax V3",
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

export const BarChart: StoryObj<Args> = {
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

export const HorizontalBarChart: StoryObj<Args> = {
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

export const StackedBarChart: StoryObj<Args> = {
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

export const SortedStackedBarChart: StoryObj<Args> = {
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

export const RibbonChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          derive((d) => orderBy(d, "count", "asc")),
          stack("species", { dir: "y" })
        )
        .mark(rect({ h: "count", fill: "species" }))
        .as("bars"),
      chart(select("bars"))
        .flow(foreach("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const StackedAreaChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          stack("species", { dir: "y" })
        )
        .mark(scaffold({ h: "count", fill: "species" }))
        .as("bars"),
      chart(select("bars"))
        .flow(foreach("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const Streamgraph: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64, alignment: "middle" }),
          stack("species", { dir: "y" })
        )
        .mark(scaffold({ h: "count", fill: "species" }))
        .as("bars"),
      chart(select("bars"))
        .flow(foreach("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const PolarRibbonChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer({ coord: clock() }, [
      chart(seafood)
        .flow(
          spread("lake", {
            dir: "x",
            spacing: (2 * Math.PI) / 6,
            mode: "center",
            y: 50,
            label: false,
          }),
          derive((d) => orderBy(d, "count", "asc")),
          stack("species", { dir: "y", label: false })
        )
        .mark(rect({ w: 0.1, h: "count", fill: "species" }))
        .as("bars"),
      chart(select("bars"))
        .flow(foreach("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
      transform: { x: 200, y: 200 },
      axes: true,
    });

    return container;
  },
};

export const GroupedBarChart: StoryObj<Args> = {
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

export const WaffleChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood)
      .flow(
        spread("lake", { spacing: 8, dir: "x" }),
        derive((d) => d.flatMap((d) => repeat(d, "count"))),
        derive((d) => _.chunk(d, 5)),
        spread({ spacing: 2, dir: "y" }),
        spread({ spacing: 2, dir: "x" })
      )
      .mark(rect({ w: 8, h: 8, fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const PieChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood, { coord: clock() })
      .flow(stack("species", { dir: "x" }))
      .mark(rect({ w: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        transform: { x: 200, y: 200 },
      });

    return container;
  },
};

export const DonutChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(seafood, { coord: clock() })
      .flow(stack("species", { dir: "x", y: 50, h: 50 }))
      .mark(rect({ w: "count", fill: "species" }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        transform: { x: 200, y: 200 },
      });

    return container;
  },
};

export const RoseChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(nightingale, { coord: clock() })
      .flow(
        stack("Month", { dir: "x" }),
        stack("Type", { dir: "y" }),
        /* TODO: push this into the h encoding of rect */
        derive((d) => d.map((d) => ({ ...d, Death: Math.sqrt(d.Death) })))
      )
      .mark(
        /* TODO: remove emX wart */
        rect({ w: (Math.PI * 2) / 12, emX: true, h: "Death", fill: "Type" })
      )
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
        transform: { x: 200, y: 200 },
      });

    return container;
  },
};

export const MosaicChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    const data = [
      { origin: "Europe", cylinders: "4", count: 66 },
      { origin: "Europe", cylinders: "5", count: 3 },
      { origin: "Europe", cylinders: "6", count: 4 },
      { origin: "Japan", cylinders: "3", count: 4 },
      { origin: "Japan", cylinders: "4", count: 69 },
      { origin: "Japan", cylinders: "6", count: 6 },
      { origin: "USA", cylinders: "4", count: 72 },
      { origin: "USA", cylinders: "6", count: 74 },
      { origin: "USA", cylinders: "8", count: 108 },
    ];

    chart(data)
      .flow(
        spread("origin", { dir: "x" }),
        derive((d) => normalize(d, "count")),
        stack("cylinders", { dir: "y" })
      )
      .mark(
        rect({ h: "count", fill: "origin", stroke: "white", strokeWidth: 2 })
      )
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const ScatterChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    chart(catchLocationsArray)
      .flow(scatter("lake", { x: "x", y: "y" }))
      .mark(circle({ r: 5 }))
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};

export const LineChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(catchLocationsArray)
        .flow(scatter("lake", { x: "x", y: "y" }))
        .mark(scaffold())
        .as("points"),
      chart(select("points")).mark(line()),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const ConnectedScatterChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(drivingShifts)
        .flow(scatter("year", { x: "miles", y: "gas" }))
        .mark(circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 }))
        .as("points"),
      chart(select("points")).mark(line({ stroke: "black", strokeWidth: 2 })),
      chart(drivingShifts)
        .flow(scatter("year", { x: "miles", y: "gas" }))
        .mark(circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 })),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const ScatterPieChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    const scatterData = _(seafood)
      .groupBy("lake")
      .map((lakeData, lake) => ({
        lake,
        x: catchLocations[lake as keyof typeof catchLocations].x,
        y: catchLocations[lake as keyof typeof catchLocations].y,
        collection: lakeData.map((item) => ({
          species: item.species,
          count: item.count,
        })),
      }))
      .value();

    chart(scatterData)
      .flow(scatter("lake", { x: "x", y: "y" }))
      .mark((data) =>
        chart(data[0].collection, { coord: clock() })
          .flow(stack("species", { dir: "x", /* h: "count" */ h: 20 }))
          .mark(rect({ w: "count", fill: "species" }))
      )
      .render(container, {
        w: args.w,
        h: args.h,
        axes: true,
      });

    return container;
  },
};
