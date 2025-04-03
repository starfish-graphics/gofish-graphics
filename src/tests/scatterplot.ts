/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { layer } from "../ast/graphicalOperators/layer";
import { ellipse } from "../ast/marks/ellipse";
import _ from "lodash";
import { ref } from "../ast/marks/ref";
import { connect } from "../ast/graphicalOperators/connect";
import { streamgraphColorPalette, streamgraphData } from "../data/streamgraphData";

// const data = [
//   { x: 0, y: 28, c: 0 },
//   { x: 0, y: 20, c: 1 },
//   { x: 1, y: 43, c: 0 },
//   { x: 1, y: 35, c: 1 },
//   { x: 2, y: 81, c: 0 },
//   { x: 2, y: 10, c: 1 },
//   { x: 3, y: 19, c: 0 },
//   { x: 3, y: 15, c: 1 },
//   { x: 4, y: 52, c: 0 },
//   { x: 4, y: 48, c: 1 },
//   { x: 5, y: 24, c: 0 },
//   { x: 5, y: 28, c: 1 },
//   { x: 6, y: 87, c: 0 },
//   { x: 6, y: 66, c: 1 },
//   { x: 7, y: 17, c: 0 },
//   { x: 7, y: 27, c: 1 },
//   { x: 8, y: 68, c: 0 },
//   { x: 8, y: 16, c: 1 },
//   { x: 9, y: 49, c: 0 },
//   { x: 9, y: 25, c: 1 },
// ];

const data = streamgraphData;

const colorPalette = streamgraphColorPalette;

export const testScatterplot = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer(
      _(data)
        .map((d) =>
          ellipse({
            x: value(d.x * 20),
            y: value(size.height - d.y),
            w: 8,
            h: 8,
            fill: colorPalette[d.c][5],
          })
        )
        .value()
    )
  );
