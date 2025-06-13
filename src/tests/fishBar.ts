/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { catchData } from "../data/catch";
import _ from "lodash";
import { stackX } from "../ast/graphicalOperators/stackX";

const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};
console.log(
  _(catchData)
    .groupBy("lake")
    .map((d) => _(d).sumBy("count"))
    .value()
);
export const testFishBar = () =>
  stackX(
    { spacing: 8, sharedScale: true },
    _(catchData)
      .groupBy("lake")
      .map((d) => rect({ w: 32, h: value(_(d).sumBy("count")) }))
      .value()
  );
