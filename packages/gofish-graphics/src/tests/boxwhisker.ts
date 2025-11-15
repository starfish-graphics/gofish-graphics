import _ from "lodash";
import {
  ConnectY,
  Ellipse,
  For,
  Frame,
  groupBy,
  Rect,
  Ref,
  StackX,
  StackY,
  v,
} from "../lib";
import { genderPayGap, payGrade } from "../data/genderPayGap";
import { Value } from "../ast/data";

const boxAndWhisker = ({
  median,
  min,
  max,
  q1,
  q3,
  fill,
}: {
  median: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  fill: Value<string>;
}) => {
  const minName = `min-${Math.random().toString(36).substring(2, 9)}`;
  const maxName = `max-${Math.random().toString(36).substring(2, 9)}`;
  return Frame({}, [
    Rect({ w: 8, h: 1, y: v(min), fill: "gray" }).name(minName),
    Rect({ w: 8, h: 1, y: v(max), fill: "gray" }).name(maxName),
    ConnectY({ mode: "center-to-center", strokeWidth: 1 }, [
      Ref(minName),
      Ref(maxName),
    ]),
    Rect({ w: 8, y: v(q1), h: v(q3 - q1), fill }),
    Rect({ w: 8, h: 1, y: v(median), fill: "white" }),
  ]);
};

export const testBoxWhiskerPlot = () =>
  StackX(
    {
      spacing: 8,
      sharedScale: true,
    },
    For(
      groupBy(
        _.orderBy(genderPayGap, (d) => payGrade.indexOf(d["Pay Grade"])),
        "Pay Grade"
      ),
      (d, key) =>
        StackX(
          {
            key,
            spacing: 8,
          },
          For(groupBy(d, "Gender"), (d, key) =>
            boxAndWhisker({
              median: d[0].Median,
              min: d[0].Min,
              max: d[0].Max,
              q1: d[0]["25-Percentile"],
              q3: d[0]["75-Percentile"],
              fill: v(key),
            })
          )
        )
    )
  );
