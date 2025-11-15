import { Coord, For, groupBy, Polar_DEPRECATED, Rect, Stack, StackX, v } from "../lib";
import { nightingale } from "../data/nightingale";

export const testRoseChart = () =>
  Coord({ transform: Polar_DEPRECATED() }, [
    Stack(
      { y: -Math.PI / 2, direction: 1, spacing: 0, alignment: "start" },
      For(groupBy(nightingale, "Month"), (d, i) =>
        StackX(
          { spacing: 0 },
          For(d, (d) =>
            Rect({
              w: Math.sqrt(d.Death) * 3,
              h: /* value(d.b, "value") */ (Math.PI * 2) / 12,
              emY: true,
              // fill: color6[i % 6],
              fill: v(d.Type),
              stroke: "white",
            })
          )
        )
      )
    ),
  ]);
