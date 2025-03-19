import _ from "lodash";
import { gofish } from "../ast/gofish";
import { value } from "../ast/data";
import { stack } from "../ast/stack";
import { rect } from "../ast/rect";
import { color } from "../color";
import { layer } from "../ast/layer";
import { connect } from "../ast/connect";
import { ref } from "../ast/ref";

const data = [
  { category: "A", group: "x", value: 0.1 },
  { category: "A", group: "y", value: 0.6 },
  { category: "A", group: "z", value: 0.9 },
  { category: "B", group: "x", value: 0.7 },
  { category: "B", group: "y", value: 0.2 },
  { category: "B", group: "z", value: 1.1 },
  { category: "C", group: "x", value: 0.6 },
  { category: "C", group: "y", value: 0.1 },
  { category: "C", group: "z", value: 0.2 },
];

export const testRibbonChart = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer([
      stack(
        { direction: 0, spacing: 64, alignment: "end", sharedScale: true },
        // TODO: I could probably make the width be uniform flexible basically
        Object.entries(_.groupBy(data, "category")).map(([category, items]) =>
          stack(
            { direction: 1, spacing: 4, alignment: "middle" },
            items.toReversed().map((d) =>
              rect({
                name: `${d.category}-${d.group}`,
                w: 32,
                h: value(d.value, "value"),
                fill: d.group === "x" ? color.red[5] : d.group === "y" ? color.blue[5] : color.green[5],
              })
            )
          )
        )
      ),
      /*  Object.entries(_.groupBy(data, "group")).map(([group, items]) =>
        connect(
          {
            direction: "x",
            fill: group === "x" ? color.red[5] : group === "y" ? color.blue[5] : color.green[5],
            interpolation: "bezier",
          },
          items.map((d) => ref(`${d.category}-${d.group}`))
        )
      ), */
    ])
  );
