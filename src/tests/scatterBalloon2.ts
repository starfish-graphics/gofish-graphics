/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { black, color, color6, white } from "../color";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar } from "../ast/coordinateTransforms/polar";
import { layer } from "../ast/graphicalOperators/layer";
import { petal } from "../ast/marks/petal";
import _ from "lodash";
import { mix } from "spectral.js";
import { balloon } from "./balloon";
import { wavy } from "../ast/coordinateTransforms/wavy";
const baseData = [
  { category: 1, value: 4 },
  { category: 2, value: 6 },
  { category: 3, value: 10 },
  { category: 4, value: 3 },
  { category: 5, value: 7 },
  { category: 6, value: 8 },
];

// Create ten copies with randomly mutated values
const flowerData = Array.from({ length: 10 }).map(() =>
  baseData.map((item) => ({
    category: item.category,
    value: Math.round(item.value * (0.5 + Math.random())),
  }))
);
console.log("flowerData", flowerData);

const bakedFlowerData = [
  [
    {
      category: 1,
      value: 3,
    },
    {
      category: 2,
      value: 3,
    },
    {
      category: 3,
      value: 8,
    },
    {
      category: 4,
      value: 3,
    },
    {
      category: 5,
      value: 6,
    },
    {
      category: 6,
      value: 9,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 9,
    },
    {
      category: 3,
      value: 8,
    },
    {
      category: 4,
      value: 4,
    },
    {
      category: 5,
      value: 8,
    },
    {
      category: 6,
      value: 11,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 5,
    },
    {
      category: 3,
      value: 10,
    },
    {
      category: 4,
      value: 2,
    },
    {
      category: 5,
      value: 8,
    },
    {
      category: 6,
      value: 8,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 5,
    },
    {
      category: 3,
      value: 7,
    },
    {
      category: 4,
      value: 3,
    },
    {
      category: 5,
      value: 6,
    },
    {
      category: 6,
      value: 10,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 7,
    },
    {
      category: 3,
      value: 6,
    },
    {
      category: 4,
      value: 3,
    },
    {
      category: 5,
      value: 6,
    },
    {
      category: 6,
      value: 10,
    },
  ],
  [
    {
      category: 1,
      value: 3,
    },
    {
      category: 2,
      value: 7,
    },
    {
      category: 3,
      value: 13,
    },
    {
      category: 4,
      value: 2,
    },
    {
      category: 5,
      value: 8,
    },
    {
      category: 6,
      value: 8,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 5,
    },
    {
      category: 3,
      value: 7,
    },
    {
      category: 4,
      value: 3,
    },
    {
      category: 5,
      value: 6,
    },
    {
      category: 6,
      value: 6,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 9,
    },
    {
      category: 3,
      value: 7,
    },
    {
      category: 4,
      value: 4,
    },
    {
      category: 5,
      value: 5,
    },
    {
      category: 6,
      value: 8,
    },
  ],
  [
    {
      category: 1,
      value: 4,
    },
    {
      category: 2,
      value: 6,
    },
    {
      category: 3,
      value: 14,
    },
    {
      category: 4,
      value: 2,
    },
    {
      category: 5,
      value: 6,
    },
    {
      category: 6,
      value: 4,
    },
  ],
  [
    {
      category: 1,
      value: 5,
    },
    {
      category: 2,
      value: 8,
    },
    {
      category: 3,
      value: 7,
    },
    {
      category: 4,
      value: 4,
    },
    {
      category: 5,
      value: 7,
    },
    {
      category: 6,
      value: 11,
    },
  ],
];

const scaleFactor = (2 * Math.PI) / _(flowerData).sumBy("value");

const colorMap = {
  0: color.red,
  1: color.blue,
  2: color.green,
  3: color.yellow,
  4: color.purple,
  5: color.orange,
};

export const testScatterBalloon2 = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 200, y: 600 } },
    coord(
      { transform: wavy(), x: 0, y: 0 },
      bakedFlowerData.map((data, i) =>
        (() => {
          const x = 20 + i * 20;
          const y = Math.random() * 200;
          const w = Math.random() * 10 + 5;

          return layer([
            rect({
              x: x,
              w: 1,
              y: y,
              h: size.height - y,
              emY: true,
              fill: black,
            }),
            balloon({ scale: 1, x: x, y: y, color: colorMap[i % 6] }),
          ]);
        })()
      )
    )
  );
