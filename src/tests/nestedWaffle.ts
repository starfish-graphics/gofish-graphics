import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/graphicalOperators/stack";
import { rect } from "../ast/marks/rect";
import { black, color, color6 } from "../color";
import { titanic } from "../data/titanic";
import { mix } from "spectral.js";
import { fish } from "../data/fishVaried";
import { ellipse } from "../ast/marks/ellipse";
import { enclose } from "../ast/graphicalOperators/enclose";

const data = [
  { origin: "Europe", cylinders: "4", count: 66 },
  { origin: "Europe", cylinders: "5", count: 3 },
  { origin: "Europe", cylinders: "6", count: 4 },
  { origin: "Japan", cylinders: "3", count: 4 },
  { origin: "Japan", cylinders: "4", count: 69 },
  { origin: "Japan", cylinders: "6", count: 6 },
  { origin: "USA", cylinders: "4", count: 72 },
  { origin: "USA", cylinders: "6", count: 74 },
  { origin: "USA", cylinders: "8", count: 108 },
];

const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testNestedWaffle = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 10, y: 10 } },
    stack(
      { direction: "y", spacing: 8, alignment: "middle", sharedScale: true },
      _(titanic)
        .groupBy("class")
        .map((cls) =>
          stack(
            { direction: "x", spacing: 4, alignment: "end" },
            _(cls)
              .groupBy("sex")
              .map((sex) =>
                enclose({}, [
                  stack(
                    { direction: "y", spacing: 0.5, alignment: "end" },
                    _(sex) // Was missing this lodash chain before .reverse()
                      .reverse()
                      .flatMap((d) => Array(d.count).fill(d))
                      .chunk(Math.ceil((_(sex).sumBy("count") / _(cls).sumBy("count")) * 32))
                      .reverse()
                      .map((d) =>
                        stack(
                          { direction: "x", spacing: 0.5, alignment: "end" },
                          d.map((d) =>
                            ellipse({
                              w: 4,
                              h: 4,
                              fill: d.survived === "No" ? black : classColor[d.class as keyof typeof classColor],
                            })
                          )
                        )
                      )
                      .value()
                  ),
                ])
              )
              .value()
          )
        )
        .value()
    )
  );
