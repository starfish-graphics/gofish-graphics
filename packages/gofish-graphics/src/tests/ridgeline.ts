import { streamgraphData } from "../data/streamgraphData";
import {
  SpreadY,
  For,
  groupBy,
  SpreadX,
  rect,
  v,
  Frame,
  ConnectX,
  ref,
} from "../lib";

export const testRidgeline = () =>
  SpreadY(
    { spacing: -30, sharedScale: true },
    For(groupBy(streamgraphData, "c"), (items, c) =>
      Frame([
        SpreadX(
          { spacing: 20 /* , sharedScale: true */ },
          For(items, (d) =>
            rect({
              // x: d.x * 20,
              // h: v(d.y),
              h: d.y,
              w: 0,
              fill: v(d.c),
            }).name(`${d.c}-${d.x}`)
          )
        ),
        ConnectX(
          {
            // interpolation: "linear",
            // opacity: 0.7,
            // mixBlendMode: "normal",
            opacity: 0.7,
          },
          For(items, (d) => ref(`${d.c}-${d.x}`))
        ),
      ])
    )
  );
