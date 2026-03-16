import {
  Chart,
  Layer,
  spread,
  stack,
  scatter,
  rect,
  circle,
  line,
  select,
  clock,
  Spread,
  For,
  ellipse,
  text,
  ref,
  Arrow,
  Frame,
  StackX,
  petal,
  polar,
  v,
} from "gofish-graphics";
import _ from "lodash";
import {
  seafood,
  catchLocationsArray,
  catchLocations,
} from "../../packages/gofish-graphics/src/data/catch";
import { drivingShifts } from "../../packages/gofish-graphics/src/data/drivingShifts";
import { testBoxWhiskerPlot } from "../../packages/gofish-graphics/src/tests/boxwhisker";

const CHART_W = 480;
const CHART_H = 320;

const color6 = [
  "#4190c5",
  "#f2cf57",
  "#a181c8",
  "#ff9666",
  "#43b780",
  "#d45e83",
];

function getContainer(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// ── Step 1: Simple bar chart ──────────────────────────────────────────────
function renderBarChart() {
  const el = getContainer("chart-bar");
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }))
    .mark(rect({ h: "count" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Step 2: Faceted chart — mark takes a chart ────────────────────────────
function renderFacetedChart() {
  const el = getContainer("chart-faceted");
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x", spacing: 48 }))
    .mark((data) =>
      Chart(data)
        .flow(spread("species", { dir: "x" }))
        .mark(rect({ h: "count", w: 20 }))
    )
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Step 3: Scatter pies — charts-within-charts ───────────────────────────
function renderScatterPieChart() {
  const el = getContainer("chart-scatter-pie");
  if (!el || el.children.length > 0) return;
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

// ── Step 3.5: Layering — connected scatter ────────────────────────────────
function renderLayeredChart() {
  const el = getContainer("chart-layered");
  if (!el || el.children.length > 0) return;
  Layer([
    Chart(drivingShifts)
      .flow(scatter("year", { x: "miles", y: "gas" }))
      .mark(
        circle({
          r: 4,
          fill: "white",
          stroke: "black",
          strokeWidth: 2,
        }).name("points")
      ),
    Chart(select("points")).mark(line({ stroke: "black", strokeWidth: 2 })),
    Chart(drivingShifts)
      .flow(scatter("year", { x: "miles", y: "gas" }))
      .mark(circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 })),
  ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Step 4: Glyphs — box and whisker in the mark slot ────────────────────
function renderBoxWhiskerChart() {
  const el = getContainer("chart-boxwhisker");
  if (!el || el.children.length > 0) return;
  testBoxWhiskerPlot().render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Step 5: Planets — diagram territory ──────────────────────────────────
const planets = [
  { name: "Mercury", radius: 15, color: "#EBE3CF" },
  { name: "Venus", radius: 36, color: "#DC933C" },
  { name: "Earth", radius: 38, color: "#179DD7" },
  { name: "Mars", radius: 21, color: "#F1CF8E" },
];

function renderPlanetsChart() {
  const el = getContainer("chart-planets");
  if (!el || el.children.length > 0) return;
  Layer([
    Spread(
      { direction: "x", spacing: 50, alignment: "middle" },
      For(planets, (planet) =>
        ellipse({
          w: planet.radius * 2,
          h: planet.radius * 2,
          fill: planet.color,
          stroke: "#333",
          strokeWidth: 2,
        }).name(planet.name)
      )
    ),
    ...planets.map((planet) =>
      Spread({ direction: "y", spacing: 0, alignment: "middle" }, [
        text({ text: planet.name }),
        ref(planet.name),
      ])
    ),
  ]).render(el, { w: CHART_W, h: 200 });
}

// ── Step 6: You have choice — flower chart ────────────────────────────────
const scatterDataForFlower = _(seafood)
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

function renderFlowerChart() {
  const el = getContainer("chart-flower");
  if (!el || el.children.length > 0) return;
  Frame(
    For(scatterDataForFlower, (sample) =>
      Frame({ x: sample.x }, [
        rect({ w: 2, h: sample.y, fill: "#2d7a2d" }),
        Frame({ y: sample.y, coord: polar() }, [
          StackX(
            {
              h: _.sumBy(sample.collection, "count") / 7,
              spacing: 0,
              alignment: "start",
              sharedScale: true,
            },
            For(sample.collection, (d, i) =>
              petal({ w: v(d.count), fill: color6[i % color6.length] })
            )
          ),
        ]),
      ])
    )
  ).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Public API ────────────────────────────────────────────────────────────
export function renderCharts() {
  renderBarChart();
  renderFacetedChart();
  renderScatterPieChart();
  renderLayeredChart();
  renderBoxWhiskerChart();
  renderPlanetsChart();
  renderFlowerChart();
}

export const chartRenderers: Record<string, () => void> = {
  "chart-bar": renderBarChart,
  "chart-faceted": renderFacetedChart,
  "chart-scatter-pie": renderScatterPieChart,
  "chart-layered": renderLayeredChart,
  "chart-boxwhisker": renderBoxWhiskerChart,
  "chart-planets": renderPlanetsChart,
  "chart-flower": renderFlowerChart,
};
