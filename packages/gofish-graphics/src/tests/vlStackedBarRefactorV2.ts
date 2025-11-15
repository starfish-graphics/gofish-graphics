import { value } from "../ast/data";
import { rect } from "../ast/shapes/rect";
import _ from "lodash";
import { stackY } from "../ast/graphicalOperators/stackY";
import { stackX } from "../ast/graphicalOperators/stackX";
import { seattleWeather } from "../data/seatle-weather";
import { stackXTemplate } from "../templates/stackXTemplate";
import { stackYTemplate } from "../templates/stackYTemplate";
import { rectTemplate } from "../templates/rectTemplate";

const colorScale = {
  sun: "#e7ba52",
  fog: "#c7c7c7",
  drizzle: "#aec7e8",
  rain: "#1f77b4",
  snow: "#9467bd",
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const stackedBarDataset = _(seattleWeather)
  .map((d) => ({
    ...d,
    month: monthNames[new Date(d.date).getMonth()],
  }))
  .value();

export const testVLStackedBarRefactorV2 = () =>
  rectTemplate(stackedBarDataset, {
    x: { field: "month", sort: monthNames, spacing: 1 },
    y: {
      field: "weather",
      sort: ["sun", "snow", "rain", "fog", "drizzle"],
      spacing: 0,
    },
    w: 12,
    h: "length",
    fillFn: (weather) => colorScale[weather as keyof typeof colorScale],
  });
