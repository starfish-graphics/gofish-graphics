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
import { stackY } from "../ast/graphicalOperators/stackY";
import { frame } from "../ast/graphicalOperators/frame";
import { ConnectX, Frame, groupBy, For, Rect, Ref, StackX, StackY, v } from "../lib";
const data = streamgraphData;
const colorPalette = streamgraphColorPalette;

export const testStackedAreaChart = () =>
  frame([
    stackX({ spacing: 0, sharedScale: true }, [
      _(data)
        .groupBy("x")
        .map((items, xCoord) =>
          stackY(
            { x: value(xCoord), spacing: 0 },
            items.map((d) =>
              rect({
                name: `${xCoord}-${d.c}`,
                h: value(d.y),
                w: 0,
                fill: value(d.c),
              })
            )
          )
        )
        .value(),
    ]),
    _(data)
      .groupBy("c")
      .map((items, c) =>
        connectX(
          {
            interpolation: "linear",
            // opacity: 0.7,
            mixBlendMode: "normal",
            strokeWidth: 1,
          },
          items.map((d) => ref(`${d.x}-${d.c}`))
        )
      )
      .value(),
  ]);

export const testStackedAreaChartV2API = () =>
  Frame([
    StackX({ spacing: 0, sharedScale: true }, [
      For(groupBy(data, "x"), (items, xCoord) =>
        StackY(
          { x: v(xCoord), spacing: 0 },
          For(items, (d) =>
            Rect({
              name: `${xCoord}-${d.c}`,
              h: v(d.y),
              w: 0,
              fill: v(d.c),
            })
          )
        )
      ),
    ]),
    For(groupBy(data, "c"), (items, c) =>
      ConnectX(
        {
          // opacity: 0.7,
          mixBlendMode: "normal",
          strokeWidth: 1,
        },
        For(items, (d) => Ref(`${d.x}-${d.c}`))
      )
    ),
  ]);
