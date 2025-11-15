import _ from "lodash";
import { NewCarColor, newCarColors } from "../data/newCarColors";
import { ConnectY, Ellipse, For, Frame, groupBy, Rect, Ref, StackY, v } from "../lib";

export const testBumpChart = () =>
  Frame({}, [
    For(groupBy(newCarColors, "Year"), (d, key) =>
      StackY(
        {
          x: ((key as number) - 2000) * 10,
          spacing: 8,
          alignment: "start",
        },
        For(_.sortBy(d, "Rank"), (d) => Ellipse({ w: 4, h: 4, fill: v(d.Color) }).name(`${d.Color}-${d.Year}`))
      )
    ),
    For(groupBy(newCarColors, "Color"), (d) =>
      ConnectY(
        { strokeWidth: 1, mode: "center-to-center" },
        For(d, (d) => Ref(`${d.Color}-${d.Year}`))
      )
    ),
  ]);
