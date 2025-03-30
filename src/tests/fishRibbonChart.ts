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

const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testFishRibbonChart = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer([
      stack(
        { direction: 0, spacing: 64, alignment: "end", sharedScale: true },
        _(fish)
          .groupBy("lake")
          .map((d) =>
            stack(
              { direction: 1, spacing: 2, alignment: "start" },
              _(d)
                .sortBy("count")
                .reverse()
                .map((d) =>
                  rect({
                    name: `${d.lake}-${d.species}`,
                    w: 16,
                    h: value(d.count),
                    fill: fishColors[d.species],
                  })
                )
                .value()
            )
          )
          .value()
      ),
      ..._(fish)
        .groupBy("species")
        .map((items, species) =>
          connect(
            {
              direction: "x",
              fill: fishColors[species as keyof typeof fishColors],
              interpolation: "bezier",
              opacity: 0.8,
            },
            items.map((d) => ref(`${d.lake}-${d.species}`))
          )
        )
        .value(),
    ])
  );
