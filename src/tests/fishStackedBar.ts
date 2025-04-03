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
import { stackY } from "../ast/graphicalOperators/stackY";
import { stackX } from "../ast/graphicalOperators/stackX";
const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testFishStackedBar = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stackX(
      { spacing: 8, sharedScale: true },
      _(fish)
        .groupBy("lake")
        .map((d) =>
          stackY(
            { spacing: 2 },
            _(d)
              .sortBy("count")
              .map((d) => rect({ w: 32, h: value(d.count), fill: fishColors[d.species] }))
              .value()
          )
        )
        .value()
    )
  );
