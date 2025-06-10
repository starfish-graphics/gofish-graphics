/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6, white } from "../color";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar_DEPRECATED } from "../ast/coordinateTransforms/polar_DEPRECATED";
import { layer } from "../ast/graphicalOperators/layer";
import { petal } from "../ast/marks/petal";
import _ from "lodash";
import { mix } from "spectral.js";
import { catchData } from "../data/catch";
import { catchLocations } from "../data/catch";
import { polar } from "../ast/coordinateTransforms/polar";
import { stackX } from "../ast/graphicalOperators/stackX";
import { frame } from "../ast/graphicalOperators/frame";
// export const testScatterFlower = (size: { width: number; height: number }) =>
//   gofish(
//     { width: size.width, height: size.height, transform: { x: 200, y: 800 } },
//     layer(
//       bakedFlowerData.map((data, i) =>
//         (() => {
//           const x = 20 + i * 20;
//           const y = Math.random() * 200;
//           const w = Math.random() * 10 + 5;

//           return layer([
//             rect({
//               x: x,
//               w: 1,
//               y: y,
//               h: size.height - y,
//               fill: color.green[5],
//             }),
//             coord(
//               {
//                 x,
//                 y,
//                 transform: polar(),
//               },
//               [
//                 stack(
//                   { w, direction: 1, spacing: 0, alignment: "start" },
//                   data.map((d, i) =>
//                     petal({
//                       h: /* value(d.b, "value") */ (d.value * (2 * Math.PI)) / _(data).sumBy("value"),
//                       emY: true,
//                       fill: mix(color6[i % 6], white, 0.6),
//                     })
//                   )
//                 ),
//               ]
//             ),
//           ]);
//         })()
//       )
//     )
//   );

const scatterData = _(catchData)
  .groupBy("lake")
  .map((lakeData, lake) => ({
    lake,
    x: catchLocations[lake as keyof typeof catchLocations].x,
    y: catchLocations[lake as keyof typeof catchLocations].y,
    collection: lakeData.map((item) => ({
      species: item.species,
      count: item.count,
    })),
  }))
  .value();

export const testScatterFlower = (height: number) =>
  frame(
    scatterData.map((sample) =>
      frame([
        rect({
          x: sample.x,
          w: 2,
          y: sample.y,
          h: height - sample.y,
          fill: color.green[5],
        }),
        frame(
          {
            x: sample.x,
            y: sample.y,
            coord: polar(),
          },
          [
            stackX(
              { h: _(sample.collection).sumBy("count") / 7, spacing: 0, alignment: "start", sharedScale: true },
              sample.collection.map((d, i) =>
                petal({
                  w: value(d.count),
                  fill: mix(color6[i % 6], white, 0.5),
                })
              )
            ),
          ]
        ),
      ])
    )
  );
