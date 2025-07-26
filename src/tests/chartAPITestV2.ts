import { Chart, guide, rect } from "../ast/marks/chart";
import { catchData } from "../data/catch";
import { streamgraphData } from "../data/streamgraphData";
import { titanic } from "../data/titanic";
import { For, groupBy, Rect, StackX, v, orderBy } from "../lib";
import _ from "lodash";

export const v2ChartBar = () =>
  rect(catchData, { fill: "lake", h: "count" }).stackX("lake").TEST_render();

export const v2ChartStackedBar = () =>
  rect(catchData, { fill: "species", h: "count" })
    .divideY("species")
    .transform((d) => orderBy(d, "count", "desc"))
    .stackX("lake")
    .TEST_render();

export const v2ChartArea = () =>
  guide(catchData, { h: "count", fill: "species" })
    .stackX("lake", { spacing: 60 })
    .connectX("lake", { opacity: 0.7 })
    .TEST_render();

export const v2ChartRibbon = () =>
  rect(catchData, { w: 24, fill: "species", h: "count" })
    .divideY("species")
    .transform((d) => orderBy(d, "count", "desc"))
    .stackX("lake", { spacing: 40 })
    .connectX("species", { over: "lake", opacity: 0.7 })
    .TEST_render();
