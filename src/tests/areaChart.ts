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
import { streamgraphData, streamgraphColorPalette } from "../data/streamgraphData";
const data = streamgraphData;
const colorPalette = streamgraphColorPalette;

export const testAreaChart = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer([
      ..._(data)
        .groupBy("c")
        .flatMap((items, c) =>
          // stack(
          //   { direction: "x", spacing: 0, alignment: "end" },
          items.map(
            (d, i) =>
              rect({
                name: `${c}-${i}`,
                x: value(d.x * 20),
                y: size.height - d.y,
                h: d.y,
                w: 0,
                fill: colorPalette[c][5],
              })
            // )
          )
        )
        .value(),
      ..._(data)
        .groupBy("c")
        .map((items, c) =>
          connect(
            {
              direction: "x",
              fill: colorPalette[c][5],
              interpolation: "linear",
              // opacity: 0.7,
              mode: "edge-to-edge",
              // mixBlendMode: "normal",
              opacity: 0.7,
            },
            items.map((d) => ref(`${c}-${d.x}`))
          )
        )
        .value(),
    ])
  );
