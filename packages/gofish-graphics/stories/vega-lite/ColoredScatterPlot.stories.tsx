import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Chart, Layer, scatter } from "../../src/lib";
import data from "vega-datasets";
import { createMark } from "../../src/ast/withGoFish";
import { Rect } from "../../src/ast/shapes/rect";
const meta: Meta = {
  title: "Vega-Lite/Colored Scatter Plot",
  argTypes: {
    w: { control: { type: "number", min: 100, max: 1000, step: 10 } },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
};

export default meta;

type Args = { w: number; h: number };

export const outlineMark = createMark((opts: {w?: any, h?: any, stroke?: any, fill?: any}) => Rect({
    w: opts.w,
    h: opts.h,
    stroke: opts.stroke,
    strokeWidth: 3,
    fill: "black",
}) as any,
{
    w: "size",
    h: "size",
    stroke: "color",
    strokeWidth: "size",
    fill: "color",
});

export const Default: StoryObj<Args> = {
  args: { w: 300, h: 300 },
  loaders: [async () => ({ penguins: await data["penguins.json"]() })],
  render: (args: Args, context: any) => {
    const container = initializeContainer();
    const penguinsRaw = context.loaded.penguins as any[];

    // Vega-Lite spec uses non-zero baselines; GoFish infers domains from data by default.
    // Filter nulls to avoid invalid positions.
    const penguins = penguinsRaw
      .filter(
        (d) =>
          d["Flipper Length (mm)"] != null &&
          d["Body Mass (g)"] != null &&
          d["Species"] != null
      )
      .map((d, i) => ({ ...d, id: i }));

      const speciesList = Array.from(new Set(penguins.map((d) => d["Species"])));
      const bySpecies = (species: string) => penguins.filter((d) => d["Species"] === species);

    Layer(
      speciesList.map((species) => () =>
        Chart(bySpecies(species))
          .flow(
            scatter("id", {
              x: "Flipper Length (mm)",
              y: "Body Mass (g)",
            })
          )
          .mark(
            outlineMark({
              w: 8,
              h: 8,
              stroke: "Species",
              fill: "Species"
            } as any)
          )
          .resolve()
      ) as any
    ).render(container, { w: args.w, h: args.h, axes: true } as any);
    return container;
  },
};
