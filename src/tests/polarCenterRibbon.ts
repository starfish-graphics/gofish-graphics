/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar } from "../ast/coordinateTransforms/polar";
import { linear } from "../ast/coordinateTransforms/linear";
import _ from "lodash";
import { layer } from "../ast/graphicalOperators/layer";
import { ref } from "../ast/marks/ref";
import { connect } from "../ast/graphicalOperators/connect";

const data = [
  { category: "A", group: "x", value: 0.1 },
  { category: "A", group: "y", value: 0.6 },
  { category: "A", group: "z", value: 0.5 },
  { category: "A", group: "w", value: 0.3 },
  { category: "A", group: "v", value: 0.2 },
  { category: "A", group: "u", value: 0.1 },
  { category: "A", group: "t", value: 0.1 },
  { category: "B", group: "x", value: 0.7 },
  { category: "B", group: "y", value: 0.2 },
  { category: "B", group: "z", value: 0.9 },
  { category: "B", group: "w", value: 0.4 },
  { category: "B", group: "v", value: 0.5 },
  { category: "B", group: "u", value: 0.4 },
  { category: "B", group: "t", value: 0.4 },
  { category: "C", group: "x", value: 0.6 },
  { category: "C", group: "y", value: 0.1 },
  { category: "C", group: "z", value: 0.2 },
  { category: "C", group: "w", value: 0.5 },
  { category: "C", group: "v", value: 0.4 },
  { category: "C", group: "u", value: 0.3 },
  { category: "C", group: "t", value: 0.2 },
].filter((d) => d.group !== "t");
// .filter((d) => (d.group === "x" || d.group === "y") && d.category !== "C");

const colorScale = {
  x: color6[0],
  y: color6[1],
  z: color6[2],
  w: color6[3],
  v: color6[4],
  u: color6[5],
};

export const testPolarCenterRibbon = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 200, y: 100 } },
    coord({ transform: polar() }, [
      layer([
        stack(
          {
            x: 50,
            direction: 1,
            spacing: (2 * Math.PI) / 3 + 0.4,
            alignment: "start",
            sharedScale: true,
            mode: "center-to-center",
          },
          Object.entries(_.groupBy(data, "category")).map(([category, items]) =>
            stack(
              {
                direction: 0,
                spacing: 0,
                alignment: "middle",
              },
              items
                .sort((a, b) => a.value - b.value)
                // .toReversed()
                .map((d) =>
                  rect({
                    name: `${d.category}-${d.group}`,
                    h: 0.3,
                    emY: true,
                    // w: value(d.value, "value"),
                    w: d.value * 20,
                    emX: true,
                    fill: colorScale[d.group as keyof typeof colorScale],
                  })
                )
            )
          )
        ),
        ..._(data)
          .groupBy("group")
          .map((items, group) =>
            connect(
              {
                direction: "y",
                fill: colorScale[group as keyof typeof colorScale],
                interpolation: "bezier",
                opacity: 0.5,
              },
              items.map((d) => ref(`${d.category}-${d.group}`))
            )
          )
          .value(),
      ]),
    ])
  );
