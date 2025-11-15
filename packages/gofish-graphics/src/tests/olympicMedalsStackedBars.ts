import { olympicMedals } from "../data/olympic-medals";
import { For, groupBy, Rect, StackX, StackY, v } from "../lib";

export const testOlympicMedalsStackedBars = () => {
  return StackX(
    { spacing: 15, sharedScale: true },
    For(groupBy(olympicMedals, "Country_Code"), (d, key) =>
      StackY(
        { key: key as string, spacing: 0 },
        For(d, (d) => Rect({ w: 20, h: v(d.Count), fill: v(d.Medal_Type) }))
      )
    )
  );
};
