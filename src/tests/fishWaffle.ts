/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { fish } from "../data/fishVaried";
import _ from "lodash";

const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testFishWaffle = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stack(
      { direction: "x", spacing: 8, alignment: "end", sharedScale: true },
      _(fish)
        .groupBy("lake")
        .map((d) =>
          stack(
            { direction: "y", spacing: 2, alignment: "start" },
            _(d)
              // .sortBy("count")
              .reverse()
              .flatMap((d) => Array(d.count).fill(d))
              .chunk(4)
              .reverse()
              .map((d) =>
                stack(
                  { direction: "x", spacing: 2, alignment: "end" },
                  d.map((d) => rect({ w: 8, h: 8, fill: fishColors[d.species] }))
                )
              )
              .value()
          )
        )
        .value()
    )
  );
