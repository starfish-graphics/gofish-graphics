import _ from "lodash";
import { stackX } from "../ast/graphicalOperators/stackX";
import { stackY } from "../ast/graphicalOperators/stackY";
import { rect } from "../ast/shapes/rect";
import { FancyDims } from "../ast/dims";
import { GoFishAST } from "../ast/_ast";
export const stackYTemplate = (
  data: any[],
  options: {
    name?: string;
    spacing?: number;
    alignment?: "start" | "middle" | "end";
    sharedScale?: boolean;
    mode?: "edge-to-edge" | "center-to-center";
    reverse?: boolean;
  } & FancyDims & { groupBy?: { field: string; sort?: string[] } },
  children: (d: any, i?: string | number) => GoFishAST
) =>
  stackY(
    options,
    options.groupBy
      ? _(data)
          .groupBy(options.groupBy.field)
          .toPairs()
          .sortBy(([i]) => options.groupBy?.sort?.indexOf(i) ?? 0)
          .fromPairs()
          .map((d, i) => children(d, i))
          .value()
      : _(data)
          .toPairs()
          .sortBy(([i]) => options.groupBy?.sort?.indexOf(i) ?? 0)
          .fromPairs()
          .map((d, i) => children(d, i))
          .value()
  );
