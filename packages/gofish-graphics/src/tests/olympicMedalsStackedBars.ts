import { olympicMedals } from "../data/olympic-medals";
import { For, groupBy, rect, StackX, StackY, v } from "../lib";

export const testOlympicMedalsStackedBars = () => {
  return StackX(
    { spacing: 15, sharedScale: true },
    For(groupBy(olympicMedals, "Country_Code"), (d, key) =>
      StackY(
        { key: key as string, spacing: 0 },
        For(d, (d) => rect({ w: 20, h: v(d.Count), fill: v(d.Medal_Type) }))
      )
    )
  );
};
