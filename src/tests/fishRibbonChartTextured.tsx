/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { catchData } from "../data/catch";
import _ from "lodash";
import { layer } from "../ast/graphicalOperators/layer";
import { connect } from "../ast/graphicalOperators/connect";
import { ref } from "../ast/marks/ref";
import { stackX } from "../ast/graphicalOperators/stackX";
import { stackY } from "../ast/graphicalOperators/stackY";
import { connectX } from "../ast/graphicalOperators/connectX";
import { frame } from "../ast/graphicalOperators/frame";
const fishColors = {
  /* Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5], */
  Bass: "url(#diamondFill)",
  Trout: "url(#diagonalLeftFill)",
  Catfish: "url(#denseDottedFill)",
  Perch: "url(#crossFill)",
  Salmon: "url(#diagonalRightFill)",
};

const defs = [
  <pattern id="noFill" fill="white" width="1" height="1" patternUnits="userSpaceOnUse">
    <rect width="1" height="1" />
  </pattern>,

  <pattern id="solidGrayFill" width="1" height="1" patternUnits="userSpaceOnUse">
    <rect width="1" height="1" fill="#808080" />
  </pattern>,

  <pattern
    id="diamondFill"
    patternUnits="userSpaceOnUse"
    width="13.23mm"
    height="26.46mm"
    patternTransform="scale(2) rotate(0)"
  >
    <path
      d="M12.5 0L0 25l12.5 25L25 25 12.5 0zm25 50L25 75l12.5 25L50 75 37.5 50z"
      stroke-width="1"
      stroke="none"
      fill="#000000"
    />
  </pattern>,

  <pattern id="denseDottedFill" width="2.5mm" height="2.5mm" patternUnits="userSpaceOnUse">
    <circle cx="1.25mm" cy="1.25mm" r="0.6mm" fill="black" />
  </pattern>,

  <pattern id="verticalFill" width="5mm" height="0.5mm" patternUnits="userSpaceOnUse">
    <line x1="1.25mm" y1="-1mm" x2="1.25mm" y2="1.5mm" stroke="black" stroke-width="1.3mm" />
  </pattern>,

  <pattern id="horizontalFill" width="0.5mm" height="5mm" patternUnits="userSpaceOnUse">
    <line x1="-1mm" y1="1.25mm" x2="1.5mm" y2="1.25mm" stroke="black" stroke-width="1.3mm" />
  </pattern>,

  <pattern id="dottedFill" width="5mm" height="5mm" patternUnits="userSpaceOnUse" fill="black" stroke="none">
    <circle cx="1.25mm" cy="1.25mm" r="1mm" />
    <circle cx="6.25mm" cy="6.25mm" r="1mm" />
  </pattern>,

  <pattern id="crossFill" width="5.08mm" height="5.08mm" patternUnits="userSpaceOnUse">
    <line
      x1="2.54mm"
      y1="0mm"
      x2="2.54mm"
      y2="5.08mm"
      stroke="black"
      stroke-width="0.8mm"
      stroke-dasharray="1mm, 1mm"
    />
  </pattern>,

  <pattern id="diagonalLeftFill" width="5.08mm" height="5.08mm" patternUnits="userSpaceOnUse">
    <line x1="-0.5mm" y1="-1.27mm" x2="7.12mm" y2="6.35mm" stroke="black" stroke-width="0.8mm" />
    <line x1="-1.77mm" y1="2.54mm" x2="2.04mm" y2="-1.27mm" stroke="black" stroke-width="0.8mm" />
  </pattern>,

  <pattern id="diagonalRightFill" width="5.08mm" height="5.08mm" patternUnits="userSpaceOnUse">
    <line x1="7.12mm" y1="-1.27mm" x2="-0.5mm" y2="6.35mm" stroke="black" stroke-width="0.8mm" />
    <line x1="2.04mm" y1="-1.27mm" x2="-1.77mm" y2="2.54mm" stroke="black" stroke-width="0.8mm" />
  </pattern>,
];

export const testFishRibbonChartTextured = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, defs },
    frame([
      stackX(
        { spacing: 128, sharedScale: true },
        _(catchData)
          .groupBy("lake")
          .map((d) =>
            stackY(
              { spacing: 2 },
              _(d)
                .orderBy("count", "desc")
                .map((d) =>
                  rect({
                    name: `${d.lake}-${d.species}`,
                    w: 16,
                    h: value(d.count),
                    // fill: value(d.species),
                    fill: fishColors[d.species as keyof typeof fishColors],
                    stroke: "black",
                    strokeWidth: 3,
                  })
                )
                .value()
            )
          )
          .value()
      ),
      ..._(catchData)
        .groupBy("species")
        .map((items) =>
          connectX(
            { opacity: 0.8, stroke: "black", strokeWidth: 3 },
            items.map((d) => ref(`${d.lake}-${d.species}`))
          )
        )
        .value(),
    ])
  );
