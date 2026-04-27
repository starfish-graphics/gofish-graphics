import { streamgraphData } from "../data/streamgraphData";
import {
  spreadY,
  For,
  groupBy,
  spreadX,
  rect,
  v,
  frame,
  connectX,
  ref,
} from "../lib";

export const testRidgeline = () =>
  spreadY(
    { spacing: -30, sharedScale: true },
    For(groupBy(streamgraphData, "c"), (items, c) =>
      frame([
        spreadX(
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
        connectX(
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
