import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { seafood } from "../../../src/data/catch";
import {
  Chart,
  spread,
  rect,
  Layer,
  select,
  Text,
  Ref,
  Spread,
  derive,
  sumBy,
} from "../../../src/lib";
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

    Layer([
      Chart(seafood)
        .flow(spread("lake", { dir: "x" }))
        .mark(rect({ h: "count" }).name("bars")),
      Chart(select("bars") as any)
        .flow(
          group("lake") as any,
          derive((d: any[]) => ({
            total: sumBy(d, "count"),
          }))
        )
        .mark((d: any) => {
          return Spread(
            { direction: "y", alignment: "middle", spacing: 10 },
            [
              Ref(d as any),
              Text({ text: d.total }),
            ]
          );
        }) as any,
    ] as any).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};


// Layer([
//   Chart(seafood)
//     .flow(spread("lake", { dir: "x" }))
//     .mark(rect({ h: "count" }).name("bars")), // 
//   Chart(select("bars"))
//     .flow(group("lake"), derive((d) => { total: sumBy(d, "count"), __ref: d[0].__ref }) ) // sumBy doesn't give the ref back this sums up the counts for each lake, ref
//     // return (total: X, ref)
//     .mark((d) => {
//       return Spread({ direction: "y", alignment: "middle", spacing: 10 }, [
//         Ref(d),
//         Text({ text: d.total }),
//       ]);
//     }),
// ]).render(container, {
//   w: args.w,
//   h: args.h,
//   axes: true,
// });