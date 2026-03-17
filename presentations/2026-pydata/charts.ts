import {
  Chart,
  Layer,
  spread,
  stack,
  scatter,
  derive,
  rect,
  circle,
  line,
  select,
  clock,
  area,
  group,
  Spread,
  For,
  Frame,
  StackX,
  ellipse,
  petal,
  text,
  ref,
  wavy,
  polar,
  v,
} from "gofish-graphics";
import _ from "lodash";
import {
  seafood,
  catchLocations,
} from "../../packages/gofish-graphics/src/data/catch";

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

// ── Opening: Franconeri — same data, two groupings ────────────────────────
function renderFranconeriA() {
  const el = getContainer("chart-franconeri-a");
  if (!el || el.children.length > 0) return;
  // Outer: lake. Inner: species side-by-side.
  // Easy query: "how do species compare within a lake?"
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }), stack("species", { dir: "x" }))
    .mark(rect({ h: "count", fill: "species" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderFranconeriB() {
  const el = getContainer("chart-franconeri-b");
  if (!el || el.children.length > 0) return;
  // Outer: species. Inner: lakes side-by-side.
  // Easy query: "how does this species vary across lakes?"
  Chart(seafood)
    .flow(spread("species", { dir: "x" }), stack("lake", { dir: "x" }))
    .mark(rect({ h: "count", fill: "lake" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Part 1 — Step 1: Bar chart ───────────────────────────────────────────
function renderBarChart() {
  const el = getContainer("chart-bar");
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }))
    .mark(rect({ h: "count" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Part 1 — Step 2: Stacked bar ─────────────────────────────────────────
function renderStackedChart() {
  const el = getContainer("chart-stacked");
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
    .mark(rect({ h: "count", fill: "species" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Part 1 — Step 5: Color/labels discussion — same chart, second instance
function renderStackedChart2() {
  const el = getContainer("chart-stacked-2");
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
    .mark(rect({ h: "count", fill: "species" }))
    .render(el, { w: CHART_W, h: 240, axes: true });
}

// ── Part 1 — Step 3: Ribbon (stacked area) ───────────────────────────────
function renderRibbonChart() {
  const el = getContainer("chart-ribbon");
  if (!el || el.children.length > 0) return;
  Layer([
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x", spacing: 64 }),
        derive((d) => _.orderBy(d, "count", "asc")),
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }).name("bars")),
    Chart(select("bars"))
      .flow(group("species"))
      .mark(area({ opacity: 0.8 })),
  ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Part 1 — Step 4: Polar ribbon ────────────────────────────────────────
function renderPolarChart() {
  const el = getContainer("chart-polar");
  if (!el || el.children.length > 0) return;
  Layer({ coord: clock() }, [
    Chart(seafood)
      .flow(
        spread("lake", {
          dir: "x",
          spacing: (2 * Math.PI) / 6,
          mode: "center",
          y: 50,
          label: false,
        }),
        derive((d) => _.orderBy(d, "count", "asc")),
        stack("species", { dir: "y", label: false })
      )
      .mark(rect({ w: 0.1, h: "count", fill: "species" }).name("bars")),
    Chart(select("bars"))
      .flow(group("species"))
      .mark(area({ opacity: 0.8 })),
  ]).render(el, { w: CHART_H, h: CHART_H, axes: true });
}

// ── Part 2: Scatter pie ───────────────────────────────────────────────────
const scatterByLake = _(seafood)
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

function renderScatterPieChart() {
  const el = getContainer("chart-scatter-pie");
  if (!el || el.children.length > 0) return;
  Chart(scatterByLake)
    .flow(scatter("lake", { x: "x", y: "y" }))
    .mark((data) =>
      Chart(data[0].collection, { coord: clock() })
        .flow(stack("species", { dir: "x", h: 20 }))
        .mark(rect({ w: "count", fill: "species" }))
    )
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Part 2: Flower chart ──────────────────────────────────────────────────
function renderFlowerChart() {
  const el = getContainer("chart-flower");
  if (!el || el.children.length > 0) return;
  Frame(
    For(scatterByLake, (sample) =>
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

// ── Part 2: Balloon chart ─────────────────────────────────────────────────
function renderBalloonChart() {
  const el = getContainer("chart-balloon");
  if (!el || el.children.length > 0) return;

  const Balloon = (x: number, y: number, scale: number, i: number) =>
    Frame(
      {
        x: x - 15 * scale,
        y: y + 27 * scale,
        box: true,
        transform: { scale: { x: scale, y: -scale } },
      },
      [
        ellipse({
          cx: 15,
          cy: 15,
          w: 24,
          h: 30,
          fill: color6[i % color6.length],
        }),
        ellipse({
          cx: 12,
          cy: 11,
          w: 7,
          h: 11,
          fill: color6[(i + 1) % color6.length],
        }),
        rect({
          cx: 15,
          cy: 32,
          w: 8,
          h: 4,
          fill: color6[(i + 2) % color6.length],
          rx: 3,
          ry: 2,
        }),
      ]
    );

  Frame(
    { coord: wavy(), x: 0, y: 0 },
    scatterByLake.map((data, i) =>
      Frame({ x: data.x }, [
        rect({ x: 0, y: 0, w: 1, h: data.y, emY: true, fill: "#333" }),
        Balloon(0, data.y, 1, i),
      ])
    )
  ).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Public API ────────────────────────────────────────────────────────────
export function renderCharts() {
  renderFranconeriA();
  renderFranconeriB();
  renderBarChart();
  renderStackedChart();
  renderStackedChart2();
  renderRibbonChart();
  renderPolarChart();
  renderScatterPieChart();
  renderFlowerChart();
  renderBalloonChart();
}

export const chartRenderers: Record<string, () => void> = {
  "chart-franconeri-a": renderFranconeriA,
  "chart-franconeri-b": renderFranconeriB,
  "chart-bar": renderBarChart,
  "chart-stacked": renderStackedChart,
  "chart-stacked-2": renderStackedChart2,
  "chart-ribbon": renderRibbonChart,
  "chart-polar": renderPolarChart,
  "chart-scatter-pie": renderScatterPieChart,
  "chart-flower": renderFlowerChart,
  "chart-balloon": renderBalloonChart,
};
