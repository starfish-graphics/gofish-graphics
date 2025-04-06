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
import { connectX } from "../ast/graphicalOperators/connectX";
import { streamgraphData, streamgraphColorPalette } from "../data/streamgraphData";
import { stackX } from "../ast/graphicalOperators/stackX";
const data = streamgraphData;
const colorPalette = streamgraphColorPalette;

export const testAreaChart = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer([
      ..._(data)
        .groupBy("c")
        .flatMap((items, c) =>
          stackX(
            { spacing: 0, sharedScale: true },
            items.map((d) =>
              rect({
                name: `${c}-${d.x}`,
                x: value(d.x),
                h: value(d.y),
                w: 0,
                fill: value(c),
              })
            )
          )
        )
        .value(),
      ..._(data)
        .groupBy("c")
        .map((items, c) =>
          connectX(
            {
              interpolation: "linear",
              // opacity: 0.7,
              // mixBlendMode: "normal",
              opacity: 0.7,
            },
            items.map((d) => ref(`${c}-${d.x}`))
          )
        )
        .value(),
    ])
  );
