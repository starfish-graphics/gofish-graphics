import _ from "lodash";
import { caltrain, caltrainStopOrder } from "../data/caltrain";
import { ConnectY, Ellipse, For, Frame, groupBy, Rect, Ref, StackY, v } from "../lib";

const caltrainProcessed = caltrain.filter((d) => d.Type !== "Bullet");

export const testStringLine = () =>
  Frame({}, [
    StackY(
      {
        spacing: 8,
        alignment: "start",
      },
      For(
        groupBy(
          _.orderBy(caltrainProcessed, (d) => caltrainStopOrder.indexOf(d.Station), "desc"),
          "Station"
        ),
        (d, key) =>
          Frame({ key }, [
            Rect({ w: 0, h: 0 }),
            For(d, (d) =>
              Ellipse({ x: d.Time / 3, w: 4, h: 4, fill: v(d.Direction) }).name(`${d.Train}-${d.Station}-${d.Time}`)
            ),
          ])
      )
    ),
    For(groupBy(caltrainProcessed, "Train"), (d) =>
      ConnectY(
        { strokeWidth: 1, mode: "center-to-center" },
        For(d, (d) => Ref(`${d.Train}-${d.Station}-${d.Time}`))
      )
    ),
  ]);
