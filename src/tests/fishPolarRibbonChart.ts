/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { fish } from "../data/fishVaried";
import _ from "lodash";
import { layer } from "../ast/graphicalOperators/layer";
import { connect } from "../ast/graphicalOperators/connect";
import { ref } from "../ast/marks/ref";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar } from "../ast/coordinateTransforms/polar";
// import { fishData } from "../data/fish";

const colorScale = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testFishPolarRibbonChart = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 200, y: 200 } },
    coord({ transform: polar() }, [
      layer([
        stack(
          {
            x: 50,
            y: (-3 * Math.PI) / 6,
            direction: 1,
            spacing: (2 * Math.PI) / 6,
            alignment: "start",
            sharedScale: true,
            mode: "center-to-center",
          },
          Object.entries(_.groupBy(fish, "lake")).map(([lake, items]) =>
            stack(
              {
                direction: 0,
                spacing: 2,
                alignment: "middle",
              },
              items
                .sort((a, b) => a.count - b.count)
                // .toReversed()
                .map((d) =>
                  rect({
                    name: `${d.lake}-${d.species}`,
                    h: 0.1,
                    // h: 0.1,
                    emY: true,
                    // w: value(d.value, "value"),
                    w: d.count,
                    emX: true,
                    fill: colorScale[d.species as keyof typeof colorScale],
                  })
                )
            )
          )
        ),
        ..._(fish)
          .groupBy("species")
          .map((items, species) =>
            connect(
              {
                direction: "y",
                fill: colorScale[species as keyof typeof colorScale],
                interpolation: "bezier",
                opacity: 0.8,
              },
              items.map((d) => ref(`${d.lake}-${d.species}`))
            )
          )
          .value(),
      ]),
    ])
  );
