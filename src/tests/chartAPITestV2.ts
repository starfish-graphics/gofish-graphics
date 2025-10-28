import { Chart, guide, rect } from "../ast/marks/chart";
import {
  seafood,
  catchLocations,
  catchLocationsArray,
  catchDataWithLocations,
} from "../data/catch";
import { streamgraphData } from "../data/streamgraphData";
import { titanic } from "../data/titanic";
import { For, groupBy, Rect, StackX, v, orderBy, polar, color } from "../lib";
import _ from "lodash";

export const v2ChartRect = () =>
  rect({ fill: color.green[5], w: 32, h: 300 }).TEST_render();

export const v2ChartRectSpread = () =>
  rect(seafood, { fill: color.green[5], w: 32, h: 300 })
    .spreadX("lake")
    .TEST_render();

export const v2ChartBar = () =>
  rect(seafood, { fill: "lake", h: "count" })
    .spreadX("lake", { alignment: "middle" })
    .TEST_render();

export const v2ChartBarHorizontal = () =>
  rect(seafood, { fill: "lake", w: "count" })
    .spreadY("lake", { alignment: "start" })
    .TEST_render();

export const v2ChartScatter = () =>
  rect(catchLocationsArray, {
    fill: color.blue[5],
    rx: 20,
    ry: 20,
    w: 20,
    h: 20,
  })
    .scatter("lake", { x: "x", y: "y" })
    .TEST_render();

export const v2ChartStackedBar = () =>
  rect(seafood, { fill: "species", h: "count" })
    .stackY("species" /* , { w: "count" } */)
    .transform((d) => orderBy(d, "count", "asc"))
    .spreadX("lake", { alignment: "start" })
    .TEST_render();

export const v2ChartPies = () =>
  rect(seafood, { fill: "species", w: "count", h: 40 })
    .stackX("species")
    .transform((d) => orderBy(d, "count", "asc"))
    .coord(polar())
    .spreadX("lake", { spacing: 100 })
    .TEST_render();

export const v2ChartPie = () =>
  rect(seafood, { fill: "species", w: "count", h: 40 })
    .stackX("species")
    .transform((d) => orderBy(d, "count", "asc"))
    .coord(polar())
    // .spreadX("lake", { spacing: 100 })
    .TEST_render();

export const v2ChartScatterPie = () =>
  rect(catchDataWithLocations, { fill: "species", w: "count" })
    .stackX("species", { h: 20 /* "count" */ })
    .transform((d) => orderBy(d, "count", "asc"))
    .coord(polar())
    .scatter("lake", { x: "x", y: "y" })
    // .spreadX("lake", { spacing: 100 })
    .TEST_render();

// export const v2ChartWaffle = () =>
//   rect(catchData, { fill: "species", w: 8, h: 8 })
//     .stackX("species")
//     .transform((d) =>
//       _(orderBy(d, "count", "desc"))
//         .flatMap((d) => Array(d.count).fill(d))
//         .chunk(4)
//         .value()
//     )
//     .coord(polar())
//     .spreadX("lake")
//     .TEST_render();

export const v2ChartArea = () =>
  guide(seafood, { h: "count", fill: "species" })
    .spreadX("lake", { spacing: 60 })
    .connectX("lake", { opacity: 0.7 })
    .TEST_render();

export const v2ChartRibbon = () =>
  rect(seafood, { w: 24, fill: "species", h: "count" })
    .stackY("species")
    .transform((d) => orderBy(d, "count", "asc"))
    .spreadX("lake", { spacing: 40 })
    .connectX("species", { over: "lake", opacity: 0.7 })
    .TEST_render();

export const v2ChartPolarRibbon = () =>
  rect(seafood, {
    ts: 0.1,
    fill: "species",
    rs: "count",
  })
    .stackR("species")
    .transform((d) => orderBy(d, "count", "asc"))
    .spreadT("lake", {
      r: 50,
      spacing: (2 * Math.PI) / 6,
      mode: "center",
    })
    .connectT("species", { over: "lake", opacity: 0.7 })
    .coord(polar())
    .TEST_render();

export const v2ChartNestedMosaic = () =>
  rect(titanic, { h: "count", fill: "class" })
    .stackY("survived", { w: "count" })
    .spreadX("sex", { h: "count" })
    .spreadY("class", { spacing: 20 });

// ALMOST A BUMP CHART!!!!!
export const v2ChartRibbonMessAround = () =>
  rect(seafood, { w: 20, fill: "species", h: 20 })
    .spreadY("species", { label: false, spacing: 20 })
    .transform((d) => orderBy(d, "count", "asc"))
    .spreadX("lake", { spacing: 40 })
    .connectX("species", { over: "lake", opacity: 0.7 })
    .TEST_render();

export const v2ChartMosaic = () =>
  rect(seafood, { fill: "species", h: "count" })
    .stackY("species", { w: "count" })
    .transform((d) => orderBy(d, "count", "asc"))
    .spreadX("lake")
    .TEST_render();

/* 
guide(seafood, {
    fill: "species",
    h: "count",
  })
    .stackY("species", { spacing: 2, reverse: true })
    .transform((d) => orderBy(d, "count", "desc"))
    .spreadX("lake", {
      y: 50,
      x: -Math.PI / 2,
      spacing: (2 * Math.PI) / 6,
      alignment: "start",
    })
    .connectX("species", { over: "lake", opacity: 1 })
    .coord(polar())
  .render(root, {
    transform: { x: 150, y: 150},
  w: 500,
  h: 300,
    // axes: true,
});
*/

/* 
guide(seafood, {
    fill: "species",
    h: "count",
  })
    .stackY("species", { reverse: true })
    .transform((d) => orderBy(d, "count", "desc"))
    .spreadX("lake", {
      y: 50,
      x: -Math.PI / 2,
      spacing: (2 * Math.PI) / 6,
      alignment: "start",
    })
    .connectX("species", { over: "lake", opacity: 1 })
    .coord(polar())
  .render(root, {
    transform: { x: 150, y: 150},
  w: 500,
  h: 300,
    // axes: true,
});

*/
