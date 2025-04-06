import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/marks/rect";
import { color, color6 } from "../color";
import { layer } from "../ast/graphicalOperators/layer";
import { connect } from "../ast/graphicalOperators/connect";
import { ref } from "../ast/marks/ref";
import { color10Order } from "./color10";
import { mix } from "spectral.js";
import { cubes } from "rybitten/cubes";
import { rybHsl2rgb } from "rybitten";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar } from "../ast/coordinateTransforms/polar";
import { linear } from "../ast/coordinateTransforms/linear";

const data = [
  { category: "A", group: "x", value: 0.1 },
  { category: "A", group: "y", value: 0.6 },
  { category: "A", group: "z", value: 0.9 },
  { category: "A", group: "w", value: 0.3 },
  { category: "A", group: "v", value: 0.2 },
  { category: "A", group: "u", value: 0.1 },
  { category: "A", group: "t", value: 0.1 },
  { category: "B", group: "x", value: 0.7 },
  { category: "B", group: "y", value: 0.2 },
  { category: "B", group: "z", value: 1.1 },
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
/* .filter((d) => (d.group === "x" || d.group === "y") && d.category !== "C"); */

const colorScale = {
  x: color6[0],
  y: color6[1],
  z: color6[2],
  w: color6[3],
  v: color6[4],
  u: color6[5],
};

/* 
Plan of attack:
coords work like this:
- layout: during layout, they flatten their child hierarchy completely, so it's easy to transform them (and
  also because coord doesn't care about graphical operators, only positions)
- rendering: then, during rendering, each mark applies its coordinate transform context. its behavior is
  influenced by its mark embedding "mode"
*/

export const testPolarRibbonOther = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 275, y: 300 } },
    coord({ transform: polar() }, [
      layer([
        stack(
          { x: 100, y: Math.PI, direction: 1, spacing: Math.PI / 6, alignment: "middle", sharedScale: true },
          // TODO: I could probably make the width be uniform flexible basically
          Object.entries(_.groupBy(data, "category")).map(([category, items]) =>
            stack(
              { direction: 0, spacing: 0, alignment: "middle" },
              items
                .sort((a, b) => a.value - b.value)
                .map((d) =>
                  rect({
                    name: `${d.category}-${d.group}`,
                    h: 16,
                    // h: value(d.value, "value"),
                    w: d.value * 50,
                    emX: true,
                    // emY: true,
                    fill: colorScale[d.group as keyof typeof colorScale],
                  })
                )
            )
          )
        ),
        ...Object.entries(_.groupBy(data, "group")).map(([group, items], i) =>
          connect(
            {
              direction: "y",
              mode: "center-to-center",
              fill: colorScale[group as keyof typeof colorScale],
              // fill: "black",
              // fill: "none",
              stroke: i == 0 ? "black" : "none",
              interpolation: "bezier",
              opacity: 1,
            },
            items.map((d) => ref(`${d.category}-${d.group}`))
          )
        ),
      ]),
    ])
  );
