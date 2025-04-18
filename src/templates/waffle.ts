import _ from "lodash";
import { stackX } from "../ast/graphicalOperators/stackX";
import { stackY } from "../ast/graphicalOperators/stackY";
import { rect } from "../ast/marks/rect";

// Shared waffle mark function
export const waffleMark = (
  data: any[],
  options: {
    chunkSize: number;
    spacing: number;
    rectSize: number;
    fillFn: (d: any) => string;
    orderBy?: { field: string; sort: string[] };
  }
) =>
  stackY(
    { spacing: options.spacing, alignment: "start" },
    _(data)
      .sortBy((d) => options.orderBy?.sort?.indexOf(d[options.orderBy?.field]) ?? 0)
      .chunk(options.chunkSize)
      .reverse()
      .map((row) =>
        stackX(
          { spacing: options.spacing },
          row.map((d) =>
            rect({
              w: options.rectSize,
              h: options.rectSize,
              fill: options.fillFn(d),
            })
          )
        )
      )
      .value()
  );
