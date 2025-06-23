/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { rect } from "../ast/shapes/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { catchData } from "../data/catch";
import _ from "lodash";
import { stackY } from "../ast/graphicalOperators/stackY";
import { stackX } from "../ast/graphicalOperators/stackX";
import { For } from "../ast/iterators/for";
const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testFishStackedBar = () =>
  stackX(
    { spacing: 8, sharedScale: true },
    For(_(catchData).groupBy("lake"), (d) =>
      stackY(
        { spacing: 2 },
        For(d, (d) => rect({ w: 32, h: value(d.count), fill: value(d.species) }))
      )
    )
  );

export const testFishStackedBarDataStyle = () =>
  stackX(_(catchData).groupBy("lake").values().value(), { spacing: 8, sharedScale: true }, (lake) =>
    stackY(lake, { spacing: 2 }, (d) => rect({ w: 32, h: value(d.count), fill: value(d.species) }))
  );
