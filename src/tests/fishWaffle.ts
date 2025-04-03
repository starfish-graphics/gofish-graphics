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
import { stackX } from "../ast/graphicalOperators/stackX";
import { stackY } from "../ast/graphicalOperators/stackY";
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
    stackX(
      { spacing: 8, sharedScale: true },
      _(fish)
        .groupBy("lake")
        .map((d) =>
          stackY(
            { spacing: 2, alignment: "start" },
            _(d)
              .reverse()
              .flatMap((d) => Array(d.count).fill(d))
              .chunk(4)
              .reverse()
              .map((d) =>
                stackX(
                  { spacing: 2 },
                  d.map((d) => rect({ w: 8, h: 8, fill: fishColors[d.species] }))
                )
              )
              .value()
          )
        )
        .value()
    )
  );
