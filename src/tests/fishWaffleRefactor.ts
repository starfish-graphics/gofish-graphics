/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/shapes/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { catchData } from "../data/catch";
import _ from "lodash";

const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

const waffleY = (data: any[], { y, numRows }: { y: string; numRows: number }, mark: (d: any) => any) =>
  stack(
    { direction: "y", spacing: 2, alignment: "start" },
    _(data)
      .reverse()
      .flatMap((d) => Array(d[y]).fill(d))
      .chunk(numRows)
      .reverse()
      .map((d) => stack({ direction: "x", spacing: 2, alignment: "start" }, d.map(mark)))
      .value()
  );

export const testFishWaffleRefactor = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stack(
      { direction: "x", spacing: 8, alignment: "end", sharedScale: true },
      _(catchData)
        .groupBy("lake")
        .map((d) => waffleY(d, { y: "count", numRows: 4 }, (d) => rect({ w: 8, h: 8, fill: fishColors[d.species] })))
        .value()
    )
  );
