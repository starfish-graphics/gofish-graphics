import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import {
  Chart,
  cut,
  layer,
  rect,
  image,
  text,
  Constraint,
  select,
  ref,
} from "../../src/lib";
import bottlePng from "../assets/wilsonblanco.png";

// What's actually in a bottle of wine, by volume.
const bottleData = [
  { category: "Marketing", amount: 6 },
  { category: "Pretentiousness", amount: 7 },
  { category: "Sulfites", amount: 2 },
  { category: "Tannins", amount: 3 },
  { category: "Water", amount: 40 },
  { category: "Grape juice", amount: 42 },
];

const abcdData = [
  { label: "A" },
  { label: "B" },
  { label: "C" },
  { label: "D" },
];

const meta: Meta = {
  title: "Forward Syntax V3/Cut",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1200, step: 10 } },
    h: { control: { type: "number", min: 100, max: 1200, step: 10 } },
  },
};
export default meta;

type Args = { w: number; h: number };

/** Image (bottle, stand-in for cucumber) sliced horizontally by `amount`. */
export const ImageCut: StoryObj<Args> = {
  args: { w: 400, h: 700 },
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(bottleData)
      .flow(
        cut({
          shape: image({ href: bottlePng, w: 193, h: 600 }),
          by: "category",
          dir: "y",
          size: "amount",
          inset: 4,
          spacing: 4,
          reverse: true,
        })
      )
      .mark(({ slice }) => slice)
      .render(container, {
        w: args.w,
        h: args.h,
        axes: false,
      });

    return container;
  },
};

/** Cut chart with labels added via select() in a separate sub-chart. The cut
 *  chart returns just the named slice (so labels don't widen its layer bbox
 *  and skew slice alignment). A second sub-chart selects "part" and overlays
 *  category and amount labels at each slice's position. */
export const ImageCutWithLabels: StoryObj<Args> = {
  args: { w: 800, h: 700 },
  render: (args: Args) => {
    const container = initializeContainer();

    type Datum = { category: string; amount: number };

    layer<Datum>([
      Chart(bottleData)
        .flow(
          cut({
            shape: image({ href: bottlePng, w: 193, h: 600 }),
            by: "category",
            dir: "y",
            size: "amount",
            inset: 4,
            spacing: 20,
            reverse: true,
          })
        )
        .mark(({ slice }) => slice.name("part")),

      Chart(select<Datum>("part")).mark((data) =>
        layer(
          (data as Array<Datum & { __ref: any }>).map((d) =>
            layer([
              ref(d.__ref).setName("slice"),
              text({
                fontSize: 18,
                fontWeight: "bold",
                fill: "#1c5e20",
                text: d.category,
              }).name("label"),
              text({
                fontSize: 36,
                fontFamily: "Impact",
                fill: "#1c5e20",
                text: `${d.amount}`,
              }).name("amount"),
            ]).constrain(({ slice, label, amount }) => [
              Constraint.align(
                { dir: "y", alignment: "middle" },
                [slice, label]
              ),
              Constraint.distribute(
                { dir: "x", spacing: 12 },
                [slice, label]
              ),
              Constraint.align(
                { dir: "x", alignment: "middle" },
                [slice, amount]
              ),
              Constraint.align(
                { dir: "y", alignment: "middle" },
                [slice, amount]
              ),
            ])
          )
        )
      ),
    ]).render(container, { w: args.w, h: args.h, axes: false });

    return container;
  },
};

/** Solid rect cut into 4 equal slices along x with 4px gaps and centered
 *  letter labels. Demonstrates equal-slice default + inset. */
export const RectEqualSlices: StoryObj<Args> = {
  args: { w: 600, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(abcdData)
      .flow(
        cut({
          shape: rect({ w: 400, h: 80, fill: "steelblue" }),
          by: "label",
          dir: "x",
          spacing: 4,
        })
      )
      .mark(({ slice, ...d }) =>
        layer([
          slice.name("part"),
          text({ fontSize: 28, fill: "white", text: d.label }).name("lbl"),
        ]).constrain(({ part, lbl }) => [
          Constraint.align({ dir: "x", alignment: "middle" }, [part, lbl]),
          Constraint.align({ dir: "y", alignment: "middle" }, [part, lbl]),
        ])
      )
      .render(container, { w: args.w, h: args.h, axes: false });

    return container;
  },
};

/** Same as above but with no inset — adjacent slices should touch. */
export const RectNoInset: StoryObj<Args> = {
  args: { w: 600, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Chart(abcdData)
      .flow(
        cut({
          shape: rect({ w: 400, h: 80, fill: "tomato" }),
          by: "label",
          dir: "x",
          inset: 0,
        })
      )
      .mark(({ slice, ...d }) =>
        layer([
          slice.name("part"),
          text({ fontSize: 28, fill: "white", text: d.label }).name("lbl"),
        ]).constrain(({ part, lbl }) => [
          Constraint.align({ dir: "x", alignment: "middle" }, [part, lbl]),
          Constraint.align({ dir: "y", alignment: "middle" }, [part, lbl]),
        ])
      )
      .render(container, { w: args.w, h: args.h, axes: false });

    return container;
  },
};

/** Image cut into 3 equal slices along y — each slice should show one third of
 *  the bottle (top/middle/bottom). Sanity check that masks line up. */
export const ImageEqualSlices: StoryObj<Args> = {
  args: { w: 600, h: 700 },
  render: (args: Args) => {
    const container = initializeContainer();

    Chart([{ k: "top" }, { k: "mid" }, { k: "bot" }])
      .flow(
        cut({
          shape: image({ href: bottlePng, w: 193, h: 600 }),
          by: "k",
          dir: "y",
          inset: 0,
          reverse: true,
        })
      )
      .mark(({ slice, ...d }) =>
        layer([
          slice.name("part"),
          text({ fontSize: 28, fill: "red", text: d.k }).name("lbl"),
        ]).constrain(({ part, lbl }) => [
          Constraint.align({ dir: "x", alignment: "middle" }, [part, lbl]),
          Constraint.align({ dir: "y", alignment: "middle" }, [part, lbl]),
        ])
      )
      .render(container, { w: args.w, h: args.h, axes: false });

    return container;
  },
};

/** Single slice — sanity check that ONE slice clips correctly. */
export const SingleSlice: StoryObj<Args> = {
  args: { w: 400, h: 700 },
  render: (args: Args) => {
    const container = initializeContainer();
    Chart([{ k: "only" }])
      .flow(
        cut({
          shape: image({ href: bottlePng, w: 193, h: 600 }),
          by: "k",
          dir: "y",
          inset: 0,
        })
      )
      .mark(({ slice }) => slice)
      .render(container, { w: args.w, h: args.h, axes: false });
    return container;
  },
};

/** dir: "x" with the bottle image — vertical slices with labels above. */
export const ImageHorizontalCut: StoryObj<Args> = {
  args: { w: 1100, h: 500 },
  render: (args: Args) => {
    const container = initializeContainer();

    const data = [
      { label: "I", weight: 1 },
      { label: "II", weight: 2 },
      { label: "III", weight: 3 },
      { label: "IV", weight: 2 },
      { label: "V", weight: 1 },
    ];

    Chart(data)
      .flow(
        cut({
          shape: image({ href: bottlePng, w: 800, h: 200 }),
          by: "label",
          dir: "x",
          size: "weight",
          inset: 4,
          spacing: 6,
        })
      )
      .mark(({ slice, ...d }) =>
        layer([
          slice.name("part"),
          text({ fontSize: 24, fontWeight: "bold", text: d.label }).name("lbl"),
        ]).constrain(({ part, lbl }) => [
          Constraint.align({ dir: "x", alignment: "middle" }, [part, lbl]),
          Constraint.align({ dir: "y", alignment: "middle" }, [part, lbl]),
        ])
      )
      .render(container, { w: args.w, h: args.h, axes: false });

    return container;
  },
};
