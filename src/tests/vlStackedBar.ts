import { value } from "../ast/data";
import { rect } from "../ast/marks/rect";
import _ from "lodash";
import { stackY } from "../ast/graphicalOperators/stackY";
import { stackX } from "../ast/graphicalOperators/stackX";
import { seattleWeather } from "../data/seatle-weather";

const colorScale = {
  sun: "#e7ba52",
  fog: "#c7c7c7",
  drizzle: "#aec7e8",
  rain: "#1f77b4",
  snow: "#9467bd",
};

const stackedBarDataset = _(seattleWeather).groupBy((d) => {
  const date = new Date(d.date);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthNames[date.getMonth()];
});

export const testVLStackedBar = () =>
  stackX(
    { spacing: 1, sharedScale: true },
    _(stackedBarDataset)
      .toPairs()
      .sortBy(([month]) => {
        const monthOrder = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };
        return monthOrder[month as keyof typeof monthOrder];
      })
      .fromPairs()
      .map((d) =>
        stackY(
          { spacing: 0 },
          _(d)
            .groupBy("weather")
            .toPairs()
            .sortBy(([weather]) => {
              const order = { drizzle: 0, fog: 1, rain: 2, snow: 3, sun: 4 };
              return order[weather as keyof typeof order];
            })
            .map(([weather, d]) =>
              rect({ w: 12, h: value(d.length), fill: colorScale[weather as keyof typeof colorScale] })
            )
            .value()
        )
      )
      .value()
  );
