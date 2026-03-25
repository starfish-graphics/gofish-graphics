import {
  Chart,
  Layer,
  spread,
  stack,
  scatter,
  derive,
  table,
  rect,
  scaffold,
  line,
  select,
  clock,
  area,
  group,
  Frame,
  ellipse,
  wavy,
  palette,
  gradient,
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

// Inject both rows of x-axis labels manually (used when axes: {y: true}).
// outerLabels = one per group (shown lower); innerLabels = one per bar (shown closer to axis).
// Positions are computed from the same parameters GoFish uses internally.
function injectAxisLabels(
  el: HTMLElement,
  outerLabels: string[],
  innerLabels: string[],
  spacingOuter: number,
  spacingInner: number,
  chartW: number = CHART_W
) {
  const wait = new MutationObserver(() => {
    const svg = el.querySelector("svg");
    if (!svg) return;
    wait.disconnect();

    // Expand SVG height to make room for two rows of injected labels
    const extraH = 35;
    const curH = parseFloat(svg.getAttribute("height") || "0");
    if (curH > 0) svg.setAttribute("height", String(curH + extraH));
    const vb = svg.getAttribute("viewBox");
    if (vb) {
      const parts = vb.split(/\s+/).map(Number);
      if (parts.length === 4)
        svg.setAttribute(
          "viewBox",
          `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3] + extraH}`
        );
    }

    const lm = 40; // left axis margin
    const rm = 15; // right margin (no legend)
    const plotW = chartW - lm - rm;
    const outerN = outerLabels.length;
    const innerN = innerLabels.length;
    const groupW = (plotW - (outerN - 1) * spacingOuter) / outerN;
    const barW = (groupW - (innerN - 1) * spacingInner) / innerN;
    const mainG = svg.querySelector(":scope > g");
    if (!mainG) return;

    function makeLabel(cx: number, y: number, text: string) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", String(Math.round(cx)));
      t.setAttribute("y", String(y));
      t.setAttribute("transform", "scale(1,-1)");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dominant-baseline", "hanging");
      t.setAttribute("fill", "#888");
      t.setAttribute("font-size", "10");
      t.textContent = text;
      mainG.appendChild(t);
    }

    // Inner row: one label per bar, just below axis line
    for (let gi = 0; gi < outerN; gi++) {
      const groupStart = gi * (groupW + spacingOuter);
      for (let bi = 0; bi < innerN; bi++) {
        const cx = groupStart + bi * (barW + spacingInner) + barW / 2;
        makeLabel(cx, 8, innerLabels[bi]);
      }
    }
    // Outer row: one label per group, second row below inner
    for (let gi = 0; gi < outerN; gi++) {
      const cx = gi * (groupW + spacingOuter) + groupW / 2;
      makeLabel(cx, 22, outerLabels[gi]);
    }
  });
  wait.observe(el, { childList: true, subtree: true });
}

// ── Opening: Franconeri — same data, two groupings ────────────────────────
type HeightSample = {
  age: string;
  person: "Charlie" | "River";
  height: number;
};

const franconeriHeights: HeightSample[] = [
  { age: "8", person: "Charlie", height: 50 },
  { age: "8", person: "River", height: 48 },
  { age: "10", person: "Charlie", height: 54 },
  { age: "10", person: "River", height: 53 },
  { age: "12", person: "Charlie", height: 58 },
  { age: "12", person: "River", height: 51 }, // slight but real decrease
];

const FRANCONERI_BAR_COLOR = "#7c8a99";

function renderFranconeriA() {
  const el = getContainer("chart-franconeri-a");
  if (!el || el.children.length > 0) return;
  // Outer: age. Inner: Charlie vs River side-by-side via inner spread.
  // Easy query: "who is taller at each age?"
  Chart(franconeriHeights)
    .flow(
      spread("age", { dir: "x", spacing: 32 }),
      spread("person", { dir: "x", spacing: 8 })
    )
    .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
    .render(el, { w: CHART_W, h: CHART_H, axes: { y: true } as any });
  injectAxisLabels(el, ["8", "10", "12"], ["Charlie", "River"], 32, 8);
}

const KEY_W = 280;
const KEY_H = 190;

function renderFranconeriAKey() {
  const el = getContainer("chart-franconeri-a-key");
  if (!el || el.children.length > 0) return;
  Chart(franconeriHeights)
    .flow(
      spread("age", { dir: "x", spacing: 16 }),
      spread("person", { dir: "x", spacing: 4 })
    )
    .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
    .render(el, { w: KEY_W, h: KEY_H, axes: true });
}

function renderFranconeriAColor() {
  const el = getContainer("chart-franconeri-a-color");
  if (!el || el.children.length > 0) return;
  Chart(franconeriHeights)
    .flow(
      spread("age", { dir: "x", spacing: 16 }),
      spread("person", { dir: "x", spacing: 4 })
    )
    .mark(rect({ h: "height", fill: "person" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderFranconeriAColorKey() {
  const el = getContainer("chart-franconeri-a-color-key");
  if (!el || el.children.length > 0) return;
  Chart(franconeriHeights)
    .flow(
      spread("age", { dir: "x", spacing: 16 }),
      spread("person", { dir: "x", spacing: 4 })
    )
    .mark(rect({ h: "height", fill: "person" }))
    .render(el, { w: KEY_W, h: KEY_H, axes: true });
}

function renderFranconeriC() {
  const el = getContainer("chart-franconeri-c");
  if (!el || el.children.length > 0) return;
  // Line chart over age, one line per person, color encodes person.
  // Easy query: "how does each person's height change over time?"
  Layer([
    Chart(franconeriHeights)
      .flow(group("person"), scatter("age", { x: "age", y: "height" }))
      .mark(scaffold().name("franconeri-pts")),
    Chart(select("franconeri-pts"))
      .flow(group("person"))
      .mark(line({ strokeWidth: 2 })),
  ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

function renderFranconeriB() {
  const el = getContainer("chart-franconeri-b");
  if (!el || el.children.length > 0) return;
  // Outer: person. Inner: ages side-by-side via inner spread.
  // Easy query: "how does height change across ages for each person?"
  Chart(franconeriHeights)
    .flow(
      spread("person", { dir: "x", spacing: 32 }),
      spread("age", { dir: "x", spacing: 8 })
    )
    .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
    .render(el, { w: CHART_W, h: CHART_H, axes: { y: true } as any });
  injectAxisLabels(el, ["Charlie", "River"], ["8", "10", "12"], 32, 8);
}

function renderFranconeriBKey() {
  const el = getContainer("chart-franconeri-b-key");
  if (!el || el.children.length > 0) return;
  Chart(franconeriHeights)
    .flow(
      spread("person", { dir: "x", spacing: 16 }),
      spread("age", { dir: "x", spacing: 4 })
    )
    .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
    .render(el, { w: KEY_W, h: KEY_H, axes: true });
}

const SPEC_BAR_W = 440;
const SPEC_BAR_H = 260;

/** Live bar chart on “our first GoFish spec” slides (bottom-left). */
function renderSpecBarChart(id: string) {
  const el = getContainer(id);
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(spread("lake", { dir: "x" }))
    .mark(rect({ h: "count" }))
    .render(el, { w: SPEC_BAR_W, h: SPEC_BAR_H, axes: true });
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

// ── Part 1 — Step 2b: Sorted stacked bar ─────────────────────────────────
function renderSortedChart() {
  const el = getContainer("chart-sorted");
  if (!el || el.children.length > 0) return;
  Chart(seafood)
    .flow(
      spread("lake", { dir: "x" }),
      derive((d) => _.orderBy(d, "count", "asc")),
      stack("species", { dir: "y" })
    )
    .mark(rect({ h: "count", fill: "species" }))
    .render(el, { w: CHART_W, h: CHART_H, axes: true });
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

// ── Part 1 — Step 4b: Highlighted ribbon ─────────────────────────────────
function renderRibbonHighlightChart() {
  const el = getContainer("chart-ribbon-highlight");
  if (!el || el.children.length > 0) return;
  Layer([
    Chart(seafood, {
      color: palette({ Salmon: "#e15759", Trout: "#4e79a7" }),
    })
      .flow(
        spread("lake", { dir: "x", spacing: 64 }),
        derive((d) => _.orderBy(d, "count", "asc")),
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }).name("bars")),
    Chart(select("bars"))
      .flow(group("species"))
      .mark(area({ opacity: 0.6 })),
  ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Part 1 — Step 4b: Highlighted polar ribbon ───────────────────────────
function renderPolarHighlightChart() {
  const el = getContainer("chart-polar-highlight");
  if (!el || el.children.length > 0) return;
  Layer({ coord: clock() }, [
    Chart(seafood, {
      color: palette({ Salmon: "#e15759", Trout: "#4e79a7" }),
    })
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
      .mark(area({ opacity: 0.6 })),
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

// ── Part 2: Balloon chart ─────────────────────────────────────────────────
// Species appear in seafood in this order → map to color6 indices
const speciesColorMap: Record<string, string> = {
  Bass: color6[0],
  Trout: color6[1],
  Catfish: color6[2],
  Perch: color6[3],
  Salmon: color6[4],
};

function renderBalloonChart() {
  const el = getContainer("chart-balloon");
  if (!el || el.children.length > 0) return;

  const Balloon = (
    x: number,
    y: number,
    scale: number,
    topColors: [string, string, string]
  ) =>
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
          fill: topColors[0],
        }),
        ellipse({
          cx: 12,
          cy: 11,
          w: 7,
          h: 11,
          fill: topColors[1],
        }),
        rect({
          cx: 15,
          cy: 32,
          w: 8,
          h: 4,
          fill: topColors[2],
          rx: 3,
          ry: 2,
        }),
      ]
    );

  Frame(
    { coord: wavy(), x: 0, y: 0 },
    scatterByLake.map((data) => {
      const top3 = _.orderBy(data.collection, "count", "desc").slice(0, 3);
      const topColors: [string, string, string] = [
        speciesColorMap[top3[0]?.species] ?? color6[0],
        speciesColorMap[top3[1]?.species] ?? color6[1],
        speciesColorMap[top3[2]?.species] ?? color6[2],
      ];
      return Frame({ x: data.x }, [
        rect({ x: 0, y: 0, w: 1, h: data.y, emY: true, fill: "#333" }),
        Balloon(0, data.y, 1, topColors),
      ]);
    })
  ).render(el, { w: CHART_W, h: CHART_H, axes: true });
}

// ── Public API ────────────────────────────────────────────────────────────
export function renderCharts() {
  renderFranconeriA();
  renderFranconeriAColor();
  renderFranconeriAColorKey();
  renderFranconeriB();
  renderFranconeriC();
  renderFranconeriAKey();
  renderFranconeriBKey();
  renderSpecBarChart("chart-spec-bar-1");
  renderSpecBarChart("chart-spec-bar-2");
  renderSpecBarChart("chart-spec-bar-3");
  renderStackedChart();
  renderSortedChart();
  renderStackedChart2();
  renderRibbonChart();
  renderPolarChart();
  renderRibbonHighlightChart();
  renderPolarHighlightChart();
  renderScatterPieChart();
  renderBalloonChart();
  // ribbon build sequence
  renderChartById("chart-ribbon-build-sorted");
  renderChartById("chart-ribbon-build-spaced");
  renderChartById("chart-ribbon-build-ribbon");
}

function renderChartById(id: string) {
  const fn = chartRenderers[id];
  if (fn) fn();
}

export const chartRenderers: Record<string, () => void> = {
  "chart-spec-bar-1": () => renderSpecBarChart("chart-spec-bar-1"),
  "chart-spec-bar-2": () => renderSpecBarChart("chart-spec-bar-2"),
  "chart-spec-bar-3": () => renderSpecBarChart("chart-spec-bar-3"),
  "chart-franconeri-a": renderFranconeriA,
  "chart-franconeri-a-color": renderFranconeriAColor,
  "chart-franconeri-a-color-key": renderFranconeriAColorKey,
  "chart-franconeri-a-key-2": () => {
    const el = getContainer("chart-franconeri-a-key-2");
    if (!el || el.children.length > 0) return;
    Chart(franconeriHeights)
      .flow(
        spread("age", { dir: "x", spacing: 16 }),
        spread("person", { dir: "x", spacing: 4 })
      )
      .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
      .render(el, { w: KEY_W, h: KEY_H, axes: true });
  },
  "chart-franconeri-b-key-2": () => {
    const el = getContainer("chart-franconeri-b-key-2");
    if (!el || el.children.length > 0) return;
    Chart(franconeriHeights)
      .flow(
        spread("person", { dir: "x", spacing: 16 }),
        spread("age", { dir: "x", spacing: 4 })
      )
      .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
      .render(el, { w: KEY_W, h: KEY_H, axes: true });
  },
  "chart-franconeri-a-color-key-2": () => {
    const el = getContainer("chart-franconeri-a-color-key-2");
    if (!el || el.children.length > 0) return;
    Chart(franconeriHeights)
      .flow(
        spread("age", { dir: "x", spacing: 16 }),
        spread("person", { dir: "x", spacing: 4 })
      )
      .mark(rect({ h: "height", fill: "person" }))
      .render(el, { w: KEY_W, h: KEY_H, axes: true });
  },
  "chart-franconeri-b": renderFranconeriB,
  "chart-franconeri-c": renderFranconeriC,
  "chart-franconeri-a-key": renderFranconeriAKey,
  "chart-franconeri-b-key": renderFranconeriBKey,
  // bar→stacked transition
  "chart-ba1-a": () => {
    const el = getContainer("chart-ba1-a");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }))
      .mark(rect({ h: "count" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-ba1-b": () => {
    const el = getContainer("chart-ba1-b");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  // stacked→ribbon transition
  "chart-ba2-a": () => {
    const el = getContainer("chart-ba2-a");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-ba2-b": () => {
    const el = getContainer("chart-ba2-b");
    if (!el || el.children.length > 0) return;
    Layer([
      Chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          derive((d) => _.orderBy(d, "count", "asc")),
          stack("species", { dir: "y" })
        )
        .mark(rect({ h: "count", fill: "species" }).name("bars-ba2")),
      Chart(select("bars-ba2"))
        .flow(group("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  // ribbon→color transition
  "chart-ba3-a": () => {
    const el = getContainer("chart-ba3-a");
    if (!el || el.children.length > 0) return;
    Layer([
      Chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          derive((d) => _.orderBy(d, "count", "asc")),
          stack("species", { dir: "y" })
        )
        .mark(rect({ h: "count", fill: "species" }).name("bars-ba3a")),
      Chart(select("bars-ba3a"))
        .flow(group("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-ba3-b": () => {
    const el = getContainer("chart-ba3-b");
    if (!el || el.children.length > 0) return;
    Layer([
      Chart(seafood, {
        color: palette({ Salmon: "#e15759", Trout: "#4e79a7" }),
      })
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          derive((d) => _.orderBy(d, "count", "asc")),
          stack("species", { dir: "y" })
        )
        .mark(rect({ h: "count", fill: "species" }).name("bars-ba3b")),
      Chart(select("bars-ba3b"))
        .flow(group("species"))
        .mark(area({ opacity: 0.6 })),
    ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  // retrospective — three Franconeri charts with specs
  "chart-retro-a": () => {
    const el = getContainer("chart-retro-a");
    if (!el || el.children.length > 0) return;
    Chart(franconeriHeights)
      .flow(
        spread("age", { dir: "x", spacing: 16 }),
        spread("person", { dir: "x", spacing: 4 })
      )
      .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-retro-b": () => {
    const el = getContainer("chart-retro-b");
    if (!el || el.children.length > 0) return;
    Chart(franconeriHeights)
      .flow(
        spread("person", { dir: "x", spacing: 16 }),
        spread("age", { dir: "x", spacing: 4 })
      )
      .mark(rect({ h: "height", fill: FRANCONERI_BAR_COLOR }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-retro-c": () => {
    const el = getContainer("chart-retro-c");
    if (!el || el.children.length > 0) return;
    Layer([
      Chart(franconeriHeights)
        .flow(group("person"), scatter("age", { x: "age", y: "height" }))
        .mark(scaffold().name("retro-pts")),
      Chart(select("retro-pts"))
        .flow(group("person"))
        .mark(line({ strokeWidth: 2 })),
    ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-sorted": renderSortedChart,
  "chart-sort-before": () => {
    const el = getContainer("chart-sort-before");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-sort-after": () => {
    const el = getContainer("chart-sort-after");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        derive((d) => _.orderBy(d, "count", "asc")),
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-stacked": renderStackedChart,
  "chart-stacked-2": renderStackedChart2,
  // ── Key/value structure digression ──────────────────────────────────────
  "chart-kv-stacked-2": () => {
    const el = getContainer("chart-kv-stacked-2");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: 280, h: 220, axes: true });
  },
  "chart-kv-stacked": () => {
    const el = getContainer("chart-kv-stacked");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: 280, h: 220, axes: true });
  },
  "chart-kv-grouped": () => {
    const el = getContainer("chart-kv-grouped");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        spread("species", { dir: "x", spacing: 2 })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: 280, h: 220, axes: true });
  },
  "chart-kv-grouped-r": () => {
    const el = getContainer("chart-kv-grouped-r");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(
        spread("species", { dir: "x" }),
        spread("lake", { dir: "x", spacing: 2 })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: 280, h: 220, axes: true });
  },
  "chart-kv-heatmap": () => {
    const el = getContainer("chart-kv-heatmap");
    if (!el || el.children.length > 0) return;
    Chart(seafood, { color: gradient(["#e8f4f8", "#1a5276"]) })
      .flow(table("lake", "species", { spacing: 4 }))
      .mark(rect({ fill: "count" }))
      .render(el, { w: 280, h: 220, axes: true, legend: false });
  },
  // ribbon progressive build
  "chart-ribbon-build-sorted": () => {
    const el = getContainer("chart-ribbon-build-sorted");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x" }),
        derive((d) => _.orderBy(d, "count", "asc")),
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-ribbon-build-spaced": () => {
    const el = getContainer("chart-ribbon-build-spaced");
    if (!el || el.children.length > 0) return;
    Chart(seafood)
      .flow(
        spread("lake", { dir: "x", spacing: 64 }),
        derive((d) => _.orderBy(d, "count", "asc")),
        stack("species", { dir: "y" })
      )
      .mark(rect({ h: "count", fill: "species" }))
      .render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-ribbon-build-ribbon": () => {
    const el = getContainer("chart-ribbon-build-ribbon");
    if (!el || el.children.length > 0) return;
    Layer([
      Chart(seafood)
        .flow(
          spread("lake", { dir: "x", spacing: 64 }),
          derive((d) => _.orderBy(d, "count", "asc")),
          stack("species", { dir: "y" })
        )
        .mark(rect({ h: "count", fill: "species" }).name("bars-rbuild")),
      Chart(select("bars-rbuild"))
        .flow(group("species"))
        .mark(area({ opacity: 0.8 })),
    ]).render(el, { w: CHART_W, h: CHART_H, axes: true });
  },
  "chart-ribbon": renderRibbonChart,
  "chart-polar": renderPolarChart,
  "chart-ribbon-highlight": renderRibbonHighlightChart,
  "chart-polar-highlight": renderPolarHighlightChart,
  "chart-scatter-pie": renderScatterPieChart,
  "chart-balloon": renderBalloonChart,
};
