import { penguins } from "../data/penguins";
import { Frame, For, groupBy, Rect, StackX, v, StackY, ConnectY, Ref } from "../lib";
import _ from "lodash";
import { density1d } from "fast-kde";

export const testViolinPlot = () => {
  return StackX(
    { spacing: 64, sharedScale: true },
    For(groupBy(penguins, "Species"), (d, species) => {
      const density = Array.from(density1d(d.map((p) => p["Body Mass (g)"]).filter((w) => w !== null))) as {
        x: number;
        y: number;
      }[];
      return Frame({}, [
        StackY(
          { spacing: 0 },
          For(density, (d) => Rect({ y: d.x / 40, w: d.y * 100000, h: 0, fill: v(species) }).name(`${species}-${d.x}`))
        ),
        ConnectY(
          { opacity: 1, mixBlendMode: "normal" },
          For(density, (d) => Ref(`${species}-${d.x}`))
        ),
      ]);
    })
  );
};
