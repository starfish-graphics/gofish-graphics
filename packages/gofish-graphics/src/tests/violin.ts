import { penguins } from "../data/penguins";
import { Frame, For, groupBy, SpreadX, v, SpreadY, ConnectY, ref, StackY } from "../lib";
import { rect } from "../ast/marks/chart";
import _ from "lodash";
import { density1d } from "fast-kde";

export const testViolinPlot = () => {
  return SpreadX(
    { spacing: 64, sharedScale: true },
    For(groupBy(penguins, "Species"), (d, species) => {
      const density = Array.from(density1d(d.map((p) => p["Body Mass (g)"]).filter((w) => w !== null))) as {
        x: number;
        y: number;
      }[];
      return Frame({}, [
        StackY(
          {  },
          For(density, (d) => rect({ y: d.x / 40, w: d.y * 100000, h: 0, fill: v(species) }).name(`${species}-${d.x}`))
        ),
        ConnectY(
          { opacity: 1, mixBlendMode: "normal" },
          For(density, (d) => ref(`${species}-${d.x}`))
        ),
      ]);
    })
  );
};
