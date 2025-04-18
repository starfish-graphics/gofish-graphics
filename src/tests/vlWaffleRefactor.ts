import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import _ from "lodash";
import { stackY } from "../ast/graphicalOperators/stackY";
import { stackX } from "../ast/graphicalOperators/stackX";
import { seattleWeather } from "../data/seatle-weather";
import { waffleMark } from "../templates/waffle";
import { stackXTemplate } from "../templates/stackXTemplate";

const colorScale = {
  sun: "#e7ba52",
  fog: "#c7c7c7",
  drizzle: "#aec7e8",
  rain: "#1f77b4",
  snow: "#9467bd",
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const stackedBarDataset = _(seattleWeather)
  .map((d) => ({
    ...d,
    month: monthNames[new Date(d.date).getMonth()],
  }))
  .value();

export const testVLWaffleRefactor = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    stackXTemplate(
      stackedBarDataset,
      { spacing: 4, sharedScale: true, groupBy: { field: "month", sort: monthNames } },
      (entries) =>
        waffleMark(entries, {
          chunkSize: 3,
          spacing: 0.5,
          rectSize: 3.5,
          orderBy: { field: "weather", sort: ["sun", "rain", "snow", "fog", "drizzle"] },
          fillFn: (d) => colorScale[d.weather as keyof typeof colorScale],
        })
    )
  );
