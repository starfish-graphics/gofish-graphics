import { Chart } from "../ast/marks/chart";
import { seafood } from "../data/catch";
import { streamgraphData } from "../data/streamgraphData";
import { titanic } from "../data/titanic";
import { For, groupBy, Rect, StackX, v } from "../lib";
import _ from "lodash";

export const chartRectBF = () =>
  StackX(
    { spacing: 2, sharedScale: true },
    For(groupBy(seafood, "species"), (d) =>
      Rect({ w: 32, h: v(_.sumBy(d, "count")), fill: v(d[0].species) })
    )
  );

export const chartBar = () => {
  return Chart(seafood)
    .rect({ w: 32, h: "count", fill: "species" })
    .spreadX("lake", { spacing: 2, sharedScale: true })
    .TEST_render();
};

/* 
Chart
  .rect({ w: 32, h: "count", fill: "species" })
  .stackX("lake", { spacing: 2, sharedScale: true })
  .data(catchData);
*/

/* 
Chart
  .data(catchData)
  .stackX("lake", { spacing: 2, sharedScale: true })
  .rect({ w: 32, h: "count", fill: "species" });
*/

/* 
Chart(catchData)
  .stackX("lake", { spacing: 2, sharedScale: true })
  .rect({ w: 32, h: "count", fill: "species" });
*/

/* 
Mark.rect(catchData, { w: 32, h: "count", fill: "species" })
  .stackX("lake", { spacing: 2, sharedScale: true })
*/

export const chartStackedBar = () => {
  return Chart(seafood)
    .rect({ w: 32, h: "count", fill: "species" })
    .spreadY("species", { spacing: 2 })
    .spreadX("lake", { spacing: 8, sharedScale: true })
    .TEST_render();
};

export const chartGroupedBar = () => {
  return Chart(seafood)
    .rect({ w: 8, h: "count", fill: "species" })
    .spreadX("species", { spacing: 2 })
    .spreadX("lake", { spacing: 4, sharedScale: true })
    .TEST_render();
};

export const chartFacetedBar = () => {
  return (
    Chart(seafood)
      .rect({ w: 32, h: "count", fill: "species" })
      .spreadX("lake", { spacing: 2 })
      // .connectX("lake")
      .spreadY("species", { spacing: 8, sharedScale: true })
      .TEST_render()
  );
};

/* 
let r = rect({ w: 32, h: "count", fill: "species" });
let sx = stackX("lake", { spacing: 2 }, r);
let sy = stackY("species", { spacing: 8, sharedScale: true }, sx);

sy(sx(r));

pipe(r, sx, sy);
*/

export const chartFacetedBarHorizontal = () => {
  return Chart(seafood)
    .rect({ w: 8, h: "count", fill: "species" })
    .spreadX("lake", { spacing: 2 })
    .spreadX("species", { spacing: 8, sharedScale: true })
    .TEST_render();
};

export const chartWaffle = () => {
  return Chart(seafood)
    .rect({ w: 8, h: 8, fill: "species" })
    .spreadX(undefined, { spacing: 2 })
    .spreadY(
      (d) =>
        _(d)
          .reverse()
          .flatMap((d) => Array(d.count).fill(d))
          .chunk(4)
          .reverse(),
      { spacing: 2, alignment: "start" }
    )
    .spreadX("lake", { spacing: 8, sharedScale: true })
    .TEST_render();
};

/* 
Frame([
  StackX({ spacing: 60 },
    For(data, (d) => Rect({ h: "count", w: 0, fill: "species" }).name(`${d.x}`))
  ),
  ConnectX({},
    For(data, (d) => Ref(`${d.x}`))
  ),
])
*/

export const chartArea = () => {
  return Chart(seafood)
    .rect({ w: 32, h: "count", fill: "species" })
    .spreadX("lake", { spacing: 60, sharedScale: true })
    .connectX("lake", { opacity: 0.7 })
    .TEST_render();
};

export const chartStackedArea = () => {
  return Chart(seafood)
    .rect({ w: 32, h: "count", fill: "species" })
    .stackY("species", { spacing: 2 })
    .spreadX("lake", { spacing: 60, sharedScale: true })
    .connectX("species", { over: "lake", opacity: 0.7 })
    .TEST_render();
};

export const chartRidgeline = () => {
  return Chart(streamgraphData)
    .rect({ w: 2, h: 40, fill: "c" })
    .spreadX("x", { spacing: 20 })
    .connectX("x", { opacity: 0.7, debug: true })
    .spreadY("c", { spacing: 20, sharedScale: true })
    .TEST_render();
};

export const chartSankeyIcicle = () => {
  const layerSpacing = 64;
  const internalSpacing = 2;

  return Chart(titanic)
    .rect({ w: 40, h: "count", fill: "sex" })
    .spreadY("survived", { spacing: internalSpacing * 4 })
    .spreadY("sex", { spacing: internalSpacing * 2 })
    .spreadY("class", { spacing: internalSpacing, sharedScale: true })
    .TEST_render();
};

/* 
return Chart(titanic)
    .rect({ w: 40, h: "count", fill: "sex" })
    .stackY("survived", { spacing: internalSpacing * 4 })
    .stackY("sex", { spacing: internalSpacing * 2 })
    .stackY("class", { spacing: internalSpacing })
    .stackX({ spacing: layerSpacing, alignment: "middle" }, (view) => [
      Chart.rect({ w: 40, h: "count", fill: "gray" }).stackY("class", { spacing: 0, alignment: "middle" }),
      view,
    ])
    .TEST_render();
*/

/* 
stackY("class", { spacing: internalSpacing, sharedScale: true},
  stackY("sex", { spacing: internalSpacing * 2 },
    stackY("survived", { spacing: internalSpacing * 4 },
      rect({ w: 40, h: "count", fill: "sex" })
    )
  )
)
*/

/* 
Chart(titanic)
  .stackY("class", { spacing: internalSpacing, sharedScale: true })
  .stackY("sex", { spacing: internalSpacing * 2 })
  .stackY("survived", { spacing: internalSpacing * 4 })
  .rect({ w: 40, h: "count", fill: "sex" })
  .TEST_render();
*/

/* 
Chart(titanic)
  .stackX({ spacing: layerSpacing, alignment: "middle" }, [
    stackY("class", { spacing: 0, alignment: "middle" })
      .rect()
  ])
  .stackY("class", { spacing: internalSpacing, sharedScale: true })
  .stackY("sex", { spacing: internalSpacing * 2 })
  .stackY("survived", { spacing: internalSpacing * 4 })
  .rect({ w: 40, h: "count", fill: "sex" })
  .TEST_render();
*/
