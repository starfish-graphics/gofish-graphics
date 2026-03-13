import {
  Chart,
  Layer,
  spread,
  stack,
  scatter,
  group,
  rect,
  circle,
  line,
  scaffold,
  area,
  select,
  clock,
} from "gofish-graphics";
import _ from "lodash";
import {
  seafood,
  catchLocationsArray,
  catchLocations,
} from "../../packages/gofish-graphics/src/data/catch";
import { drivingShifts } from "../../packages/gofish-graphics/src/data/drivingShifts";

const CHART_W = 480;
const CHART_H = 320;

function getContainer(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function renderBarChart() {
  const el = getContainer("chart-bar");
  if (!el) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }))
    .mark(rect({ h: "count" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderStackedChart() {
  const el = getContainer("chart-stacked");
  if (!el) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
    .mark(rect({ h: "count", fill: "species" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderPieChart() {
  const el = getContainer("chart-pie");
  if (!el) return;
  Chart(seafood, { coord: clock() })
    .flow(stack("species", { dir: "x" }))
    .mark(rect({ w: "count", fill: "species" }))
    .render(el, { w: CHART_H, h: CHART_H, axes: true });
}

function renderScatterChart() {
  const el = getContainer("chart-scatter");
  if (!el) return;
  Layer([
    Chart(drivingShifts)
      .flow(scatter("year", { x: "miles", y: "gas" }))
      .mark(
        circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 }).name(
          "points"
        )
      ),
    Chart(select("points")).mark(line({ stroke: "black", strokeWidth: 2 })),
    Chart(drivingShifts)
      .flow(scatter("year", { x: "miles", y: "gas" }))
      .mark(circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 })),
  ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderAreaChart() {
  const el = getContainer("chart-area");
  if (!el) return;
  Layer([
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x", spacing: 64 }),
        stack("species", { dir: "y" })
      )
      .mark(scaffold({ h: "count", fill: "species" }).name("bars")),
    Chart(select("bars"))
      .flow(group("species"))
      .mark(area({ opacity: 0.8 })),
  ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderGlyphsChart() {
  const el = getContainer("chart-glyphs");
  if (!el) return;

  const scatterData = _(seafood)
    .groupBy("lake")
    .map((lakeData, lake) => ({
      lake,
      x: catchLocations[lake as keyof typeof catchLocations].x,
      y: catchLocations[lake as keyof typeof catchLocations].y,
      collection: lakeData.map((item) => ({
        species: item.species,
        count: item.count,
      })),
    }))
    .value();

  Chart(scatterData)
    .flow(scatter("lake", { x: "x", y: "y" }))
    .mark((data) =>
      Chart(data[0].collection, { coord: clock() })
        .flow(stack("species", { dir: "x", h: 20 }))
        .mark(rect({ w: "count", fill: "species" }))
    )
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

export function renderCharts() {
  renderBarChart();
  renderStackedChart();
  renderPieChart();
  renderScatterChart();
  renderAreaChart();
  renderGlyphsChart();
}

// Also export individual renderers for lazy/slide-change rendering
export const chartRenderers: Record<string, () => void> = {
  "chart-bar": renderBarChart,
  "chart-stacked": renderStackedChart,
  "chart-pie": renderPieChart,
  "chart-scatter": renderScatterChart,
  "chart-area": renderAreaChart,
  "chart-glyphs": renderGlyphsChart,
};
