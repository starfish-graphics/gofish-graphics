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

export const testStreamgraph = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer([
      stack(
        {
          direction: "x",
          spacing: 0,
          alignment: "middle",
          sharedScale: true,
        },
        [
          ..._(data)
            .groupBy("x")
            .map((items, xCoord) =>
              stack(
                {
                  direction: "y",
                  spacing: 0,
                  // alignment: "middle",
                },
                items.map((d) =>
                  rect({
                    name: `${xCoord}-${d.c}`,
                    x: value(d.x * 20),
                    h: value(d.y),
                    w: 0,
                    fill: colorPalette[d.c][5],
                  })
                )
              )
            )
            .value(),
        ]
      ),
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
              mixBlendMode: "normal",
              strokeWidth: 1,
            },
            items.map((d) => ref(`${d.x}-${d.c}`))
          )
        )
        .value(),
    ])
  );
