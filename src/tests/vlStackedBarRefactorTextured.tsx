import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/shapes/rect";
import _ from "lodash";
import { stackY } from "../ast/graphicalOperators/stackY";
import { stackX } from "../ast/graphicalOperators/stackX";
import { seattleWeather } from "../data/seatle-weather";
import { stackXTemplate } from "../templates/stackXTemplate";
import { stackYTemplate } from "../templates/stackYTemplate";
import { rectTemplate } from "../templates/rectTemplate";

const colorScale = {
  sun: "url(#diamondFill)",
  fog: "url(#diagonalLeftFill)",
  drizzle: "url(#denseDottedFill)",
  rain: "url(#crossFill)",
  snow: "url(#diagonalRightFill)",
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const stackedBarDataset = _(seattleWeather)
  .map((d) => ({
    ...d,
    month: monthNames[new Date(d.date).getMonth()],
  }))
  .value();

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

export const testVLStackedBarRefactorTextured = () =>
  rectTemplate(stackedBarDataset, {
    x: { field: "month", sort: monthNames, spacing: 8 },
    y: { field: "weather", sort: ["drizzle", "fog", "rain", "snow", "sun"], spacing: 0 },
    w: 40,
    h: "length",
    stroke: "black",
    strokeWidth: 0.5,
    fillFn: (weather) => colorScale[weather as keyof typeof colorScale],
  });
