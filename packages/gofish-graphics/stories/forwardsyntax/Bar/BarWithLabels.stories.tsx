import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { seafood } from "../../../src/data/catch";
import { chart, spread, rect, layer, select, Text, Ref, Spread } from "../../../src/lib";
import { group } from "../../../src/ast/marks/chart";

const meta: Meta = {
  title: "Forward Syntax V3/Bar/With Labels",
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

export const Default: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    layer([
      chart(seafood)
        .flow(spread("lake", { dir: "x" }))
        .mark(rect({ h: "count" }).name("bars")),
      chart(select("bars"))
        .flow(group("lake"))
        .mark((d) => {
          return Spread({ direction: "y", alignment: "middle", spacing: 10 }, [
            Ref(d[0]),
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
