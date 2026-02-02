<template>
  <div class="cheat-sheet">
    <!-- Search and Filter Controls -->
    <div class="controls">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search functions..."
        class="search-input"
      />
      <Switch :checked="syntax" @toggle="toggle" label1="Syntax: Chained" label2="Syntax: Composition"/>
      <!-- <div class="category-filters">
        <button
          v-for="category in categories"
          :key="category"
          @click="toggleCategory(category)"
          :class="['category-btn', { active: selectedCategories.has(category) }]"
        >
          {{ category }}
        </button>
      </div> -->
    </div>

    <!-- Category Sections -->
    <div class="category-sections">
      <div
        v-for="category in categories"
        :key="category"
        v-show="selectedCategories.has(category) && getCategoryItems(category).length > 0"
        class="category-section"
        :class="`category-${getCategorySlug(category)}`"
      >
        <div class="category-header">
          <h2 class="category-title">{{ category }}</h2>
          <span class="category-count">{{ getCategoryItems(category).length }} function{{ getCategoryItems(category).length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="category-items">
          <div
            v-for="item in getCategoryItems(category)"
            :key="item.name"
            class="card"
            :class="[
              { expanded: expandedCards.has(item.name) },
              `category-${getCategorySlug(item.category)}`
            ]"
          >
            <div class="card-category-bar" :class="`category-${getCategorySlug(item.category)}`"></div>
            <div class="card-header" @click="toggleExpand(item.name)">
              <div class="card-title-row">
                <code class="card-name">{{ item.name }}</code>
              </div>
              <div class="card-snippet">
                <code>{{ item.snippet }}</code>
              </div>
              <div class="card-params" v-if="item.params">
                <span class="params-label">Params:</span>
                <code class="params-list">{{ item.params }}</code>
              </div>
            </div>
            <div v-if="expandedCards.has(item.name)" class="card-expanded">
              <div class="card-example">
                <GoFishVue :code="item.exampleCode" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import GoFishVue from "./GoFishVue.vue";
import Switch from './subcomponents/Switch.vue';

interface CheatSheetItem {
  name: string;
  category: string;
  snippet: string;
  params?: string;
  exampleCode: string;
}

const searchQuery = ref("");
const selectedCategories = ref(new Set<string>());
const expandedCards = ref(new Set<string>());

const categories = [
  "Chart Syntax",
  "Coordinate Transforms",
  "Data Utilities",
  "Legacy Shapes/Marks",
  "Legacy Graphical Operators",
  "Main API",
  "Utilities",
];

// Initialize with all categories selected
categories.forEach((cat) => selectedCategories.value.add(cat));

const items: CheatSheetItem[] = [
  // Chart Syntax
  {
    name: "chart",
    category: "Chart Syntax",
    snippet: 'chart(data).flow(...).mark(...).render(container, { w, h })',
    params: "data, options?",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 },
  { category: "C", value: 45 }
];
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "spread",
    category: "Chart Syntax",
    snippet: 'spread("field", { dir: "x" | "y" })',
    params: "field, options",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "stack",
    category: "Chart Syntax",
    snippet: 'stack("field", { dir: "x" | "y" })',
    params: "field, options",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", type: "X", value: 20 },
  { category: "A", type: "Y", value: 10 },
  { category: "B", type: "X", value: 30 }
];
chart(data)
  .flow(
    spread("category", { dir: "x" }),
    stack("type", { dir: "y" })
  )
  .mark(rect({ h: "value", fill: "type" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "scatter",
    category: "Chart Syntax",
    snippet: 'scatter("field", { x, y })',
    params: "field, options",
    exampleCode: `const root = document.createElement("div");
const data = [
  { group: "A", x: 10, y: 20 },
  { group: "A", x: 15, y: 25 },
  { group: "B", x: 20, y: 30 }
];
chart(data)
  .flow(scatter("group", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "group",
    category: "Chart Syntax",
    snippet: 'group("field")',
    params: "field",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", x: 1, y: 10 },
  { category: "A", x: 2, y: 20 },
  { category: "B", x: 1, y: 15 }
];
chart(data)
  .flow(group("category"))
  .mark(line())
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "derive",
    category: "Chart Syntax",
    snippet: 'derive((d) => transform(d))',
    params: "transform: (data) => data",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
chart(data)
  .flow(
    derive((d) => orderBy(d, "value", "asc")),
    spread("category", { dir: "x" })
  )
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "rect",
    category: "Chart Syntax",
    snippet: 'rect({ h: "value", fill: "category" })',
    params: "options: { h?, w?, fill?, stroke? }",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value", fill: "category" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "circle",
    category: "Chart Syntax",
    snippet: 'circle({ r: 5, fill: "category" })',
    params: "options: { r?, fill?, stroke? }",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", x: 10, y: 20 },
  { category: "B", x: 30, y: 40 }
];
chart(data)
  .flow(scatter("category", { x: "x", y: "y" }))
  .mark(circle({ r: 8, fill: "category" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "select",
    category: "Chart Syntax",
    snippet: 'select("chartName")',
    params: "name: string",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
layer([
  chart(data)
    .flow(spread("category", { dir: "x" }))
    .mark(rect({ h: "value" }))
    .as("bars"),
  chart(select("bars"))
    .flow(group("category"))
    .mark(area({ opacity: 0.5 }))
]).render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "line",
    category: "Chart Syntax",
    snippet: 'line({ stroke, strokeWidth? })',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", x: 1, y: 10 },
  { category: "A", x: 2, y: 20 },
  { category: "B", x: 1, y: 15 }
];
chart(data)
  .flow(scatter("category", { x: "x", y: "y" }))
  .mark(line())
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "scaffold",
    category: "Chart Syntax",
    snippet: 'scaffold({ h: "value", fill: "category" })',
    params: "options",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", type: "X", value: 20 },
  { category: "A", type: "Y", value: 10 }
];
chart(data)
  .flow(
    spread("category", { dir: "x" }),
    stack("type", { dir: "y" })
  )
  .mark(scaffold({ h: "value", fill: "type" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "area",
    category: "Chart Syntax",
    snippet: 'area({ opacity?, fill? })',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", x: 1, y: 10 },
  { category: "A", x: 2, y: 20 },
  { category: "B", x: 1, y: 15 }
];
chart(data)
  .flow(scatter("category", { x: "x", y: "y" }))
  .mark(area({ opacity: 0.6 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "normalize",
    category: "Chart Syntax",
    snippet: 'normalize(data, "field")',
    params: "data, field",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
chart(data)
  .flow(
    derive((d) => normalize(d, "value")),
    spread("category", { dir: "x" })
  )
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "repeat",
    category: "Chart Syntax",
    snippet: 'repeat(data, "count")',
    params: "data, countField",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", count: 3 },
  { category: "B", count: 2 }
];
chart(data)
  .flow(
    spread("category", { dir: "x" }),
    derive((d) => d.flatMap((item) => repeat(item, "count")))
  )
  .mark(rect({ w: 8, h: 8 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "log",
    category: "Chart Syntax",
    snippet: 'log("message", data)',
    params: "message, data?",
    exampleCode: `const root = document.createElement("div");
const data = [{ category: "A", value: 30 }];
chart(data)
  .flow(
    derive((d) => {
      log("Data:", d);
      return d;
    }),
    spread("category", { dir: "x" })
  )
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  // Coordinate Transforms
  {
    name: "clock",
    category: "Coordinate Transforms",
    snippet: 'chart(data, { coord: clock() })',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [
  { species: "Bass", count: 23 },
  { species: "Trout", count: 31 }
];
chart(data, { coord: clock() })
  .flow(stack("species", { dir: "x" }))
  .mark(rect({ w: "count", fill: "species", emY: true }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "coord",
    category: "Coordinate Transforms",
    snippet: 'coord(transform)',
    params: "transform",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: coord(polar()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "linear",
    category: "Coordinate Transforms",
    snippet: 'linear()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: coord(linear()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "polar",
    category: "Coordinate Transforms",
    snippet: 'polar()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: coord(polar()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "polar_DEPRECATED",
    category: "Coordinate Transforms",
    snippet: 'polar_DEPRECATED()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: coord(polar_DEPRECATED()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "polarTransposed",
    category: "Coordinate Transforms",
    snippet: 'polarTransposed()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: coord(polarTransposed()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "arcLengthPolar",
    category: "Coordinate Transforms",
    snippet: 'arcLengthPolar()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: coord(arcLengthPolar()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "bipolar",
    category: "Coordinate Transforms",
    snippet: 'bipolar()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: coord(bipolar()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "wavy",
    category: "Coordinate Transforms",
    snippet: 'wavy()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: coord(wavy()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  // Data Utilities
  {
    name: "groupBy",
    category: "Data Utilities",
    snippet: 'groupBy(collection, "field")',
    params: "collection, iteratee",
    exampleCode: `const root = document.createElement("div");
const data = [
  { lake: "Lake A", species: "Bass", count: 23 },
  { lake: "Lake A", species: "Trout", count: 31 }
];
const grouped = groupBy(data, "lake");
chart(data)
  .flow(spread("lake", { dir: "x" }))
  .mark(rect({ h: "count", fill: "species" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "value",
    category: "Data Utilities",
    snippet: 'value(data, field)',
    params: "data, field",
    exampleCode: `const root = document.createElement("div");
const data = { category: "A", value: 30 };
const val = value(data, "value");
chart([data])
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: value(data, "value") }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "v",
    category: "Data Utilities",
    snippet: 'v(data, field)',
    params: "data, field",
    exampleCode: `const root = document.createElement("div");
const data = { category: "A", value: 30 };
chart([data])
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: v(data, "value") }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "For",
    category: "Data Utilities",
    snippet: 'For(data, (item) => ...)',
    params: "data, callback",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
const mapped = For(data, (d) => ({ ...d, doubled: d.value * 2 }));
chart(mapped)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "doubled" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "map",
    category: "Data Utilities",
    snippet: 'map(data, (item) => ...)',
    params: "data, callback",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
const mapped = map(data, (d) => ({ ...d, doubled: d.value * 2 }));
chart(mapped)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "doubled" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "sumBy",
    category: "Data Utilities",
    snippet: 'sumBy(collection, "field")',
    params: "collection, iteratee",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "A", value: 20 },
  { category: "B", value: 80 }
];
const total = sumBy(data, "value");
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "orderBy",
    category: "Data Utilities",
    snippet: 'orderBy(collection, "field", "asc" | "desc")',
    params: "collection, iteratees, orders?",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 },
  { category: "C", value: 45 }
];
chart(data)
  .flow(
    derive((d) => orderBy(d, "value", "asc")),
    spread("category", { dir: "x" })
  )
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "meanBy",
    category: "Data Utilities",
    snippet: 'meanBy(collection, "field")',
    params: "collection, iteratee",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "A", value: 20 },
  { category: "B", value: 80 }
];
const avg = meanBy(data, "value");
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  // Legacy Shapes/Marks
  {
    name: "ellipse",
    category: "Legacy Shapes/Marks",
    snippet: 'ellipse({ w, h, fill? })',
    params: "options",
    exampleCode: `const root = document.createElement("div");
const node = ellipse({ w: 50, h: 30, fill: color.blue[5] });
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "petal",
    category: "Legacy Shapes/Marks",
    snippet: 'petal({ w, h, fill? })',
    params: "options",
    exampleCode: `const root = document.createElement("div");
const node = petal({ w: 50, h: 30, fill: color.red[5] });
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "ref",
    category: "Legacy Shapes/Marks",
    snippet: 'ref(name)',
    params: "name: string",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Rect({ w: 50, h: 30 }),
  ref("myRef")
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Rect",
    category: "Legacy Shapes/Marks",
    snippet: 'Rect({ w, h, fill? })',
    params: "options",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Ellipse",
    category: "Legacy Shapes/Marks",
    snippet: 'Ellipse({ w, h, fill? })',
    params: "options",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Ellipse({ w: 50, h: 30, fill: color.blue[5] }),
  Ellipse({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Petal",
    category: "Legacy Shapes/Marks",
    snippet: 'Petal({ w, h, fill? })',
    params: "options",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Petal({ w: 50, h: 30, fill: color.blue[5] }),
  Petal({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Ref",
    category: "Legacy Shapes/Marks",
    snippet: 'Ref(name)',
    params: "name: string",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Rect({ w: 50, h: 30 }),
  Ref("myRef")
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  // Legacy Graphical Operators
  {
    name: "layer",
    category: "Legacy Graphical Operators",
    snippet: 'layer([chart1, chart2]).render(...)',
    params: "charts: ChartBuilder[]",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
layer([
  chart(data)
    .flow(spread("category", { dir: "x" }))
    .mark(rect({ h: "value" }))
    .as("bars"),
  chart(select("bars"))
    .flow(group("category"))
    .mark(area({ opacity: 0.8 }))
]).render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "stackX",
    category: "Legacy Graphical Operators",
    snippet: 'stackX([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = stackX([
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  rect({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "stackY",
    category: "Legacy Graphical Operators",
    snippet: 'stackY([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = stackY([
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  rect({ w: 50, h: 40, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "wrap",
    category: "Legacy Graphical Operators",
    snippet: 'wrap(node, options)',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = wrap(
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  { w: 100, h: 100 }
);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "connect",
    category: "Legacy Graphical Operators",
    snippet: 'connect([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = connect([
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "connectX",
    category: "Legacy Graphical Operators",
    snippet: 'connectX([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = connectX([
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "connectY",
    category: "Legacy Graphical Operators",
    snippet: 'connectY([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = connectY([
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "enclose",
    category: "Legacy Graphical Operators",
    snippet: 'enclose([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = enclose([
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "frame",
    category: "Legacy Graphical Operators",
    snippet: 'frame(node, options)',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = frame(
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  { w: 200, h: 200 }
);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "position",
    category: "Legacy Graphical Operators",
    snippet: 'position(node, { x, y })',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = position(
  rect({ w: 50, h: 30, fill: color.blue[5] }),
  { x: 100, y: 100 }
);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Stack",
    category: "Legacy Graphical Operators",
    snippet: 'Stack([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = Stack([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "StackX",
    category: "Legacy Graphical Operators",
    snippet: 'StackX([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "StackY",
    category: "Legacy Graphical Operators",
    snippet: 'StackY([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = StackY([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 50, h: 40, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Layer",
    category: "Legacy Graphical Operators",
    snippet: 'Layer([chart1, chart2]).render(...)',
    params: "charts: ChartBuilder[]",
    exampleCode: `const root = document.createElement("div");
const data = [{ category: "A", value: 30 }];
Layer([
  chart(data)
    .flow(spread("category", { dir: "x" }))
    .mark(rect({ h: "value" }))
]).render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "Wrap",
    category: "Legacy Graphical Operators",
    snippet: 'Wrap(node, options)',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = Wrap(
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  { w: 100, h: 100 }
);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Connect",
    category: "Legacy Graphical Operators",
    snippet: 'Connect([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = Connect([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "ConnectX",
    category: "Legacy Graphical Operators",
    snippet: 'ConnectX([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = ConnectX([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "ConnectY",
    category: "Legacy Graphical Operators",
    snippet: 'ConnectY([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = ConnectY([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Enclose",
    category: "Legacy Graphical Operators",
    snippet: 'Enclose([node1, node2])',
    params: "nodes: Node[]",
    exampleCode: `const root = document.createElement("div");
const node = Enclose([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 50, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Frame",
    category: "Legacy Graphical Operators",
    snippet: 'Frame(node, options)',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = Frame(
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  { w: 200, h: 200 }
);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "Position",
    category: "Legacy Graphical Operators",
    snippet: 'Position(node, { x, y })',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = Position(
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  { x: 100, y: 100 }
);
gofish(node, root, { width: 400, height: 300 });`,
  },
  // Coordinate Transforms (v2)
  {
    name: "Coord",
    category: "Coordinate Transforms",
    snippet: 'Coord(transform)',
    params: "transform",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: Coord(Polar()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "Linear",
    category: "Coordinate Transforms",
    snippet: 'Linear()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: Coord(Linear()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  {
    name: "Polar",
    category: "Coordinate Transforms",
    snippet: 'Polar()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: Coord(Polar()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "Polar_DEPRECATED",
    category: "Coordinate Transforms",
    snippet: 'Polar_DEPRECATED()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: Coord(Polar_DEPRECATED()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "PolarTransposed",
    category: "Coordinate Transforms",
    snippet: 'PolarTransposed()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: Coord(PolarTransposed()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "ArcLengthPolar",
    category: "Coordinate Transforms",
    snippet: 'ArcLengthPolar()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ angle: 0, radius: 10 }];
chart(data, { coord: Coord(ArcLengthPolar()) })
  .flow(scatter("angle", { x: "angle", y: "radius" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "Bipolar",
    category: "Coordinate Transforms",
    snippet: 'Bipolar()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: Coord(Bipolar()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 400, axes: true });`,
  },
  {
    name: "Wavy",
    category: "Coordinate Transforms",
    snippet: 'Wavy()',
    params: "options?",
    exampleCode: `const root = document.createElement("div");
const data = [{ x: 10, y: 20 }];
chart(data, { coord: Coord(Wavy()) })
  .flow(scatter("x", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
  // Main API
  {
    name: "gofish",
    category: "Main API",
    snippet: 'gofish(node, container, { width, height })',
    params: "node, container, options",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 80, h: 30, fill: color.red[5] })
]);
gofish(node, root, { width: 400, height: 300 });`,
  },
  {
    name: "GoFishSolid",
    category: "Main API",
    snippet: 'new GoFishSolid(node, options)',
    params: "node, options",
    exampleCode: `const root = document.createElement("div");
const node = StackX([
  Rect({ w: 50, h: 30, fill: color.blue[5] }),
  Rect({ w: 80, h: 30, fill: color.red[5] })
]);
const solid = new GoFishSolid(node, { width: 400, height: 300 });
solid.render(root);`,
  },
  // Utilities
  {
    name: "color",
    category: "Utilities",
    snippet: 'fill: color.blue[5]',
    params: "color.palette[index]",
    exampleCode: `const root = document.createElement("div");
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 80 }
];
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ 
    h: "value", 
    fill: "category"
  }))
  .render(root, { w: 400, h: 300, axes: true });`,
  },
];

const filteredItems = computed(() => {
  return items.filter((item) => {
    // Category filter
    if (!selectedCategories.value.has(item.category)) {
      return false;
    }
    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.snippet.toLowerCase().includes(query)
      );
    }
    return true;
  });
});

function getCategoryItems(category: string) {
  return filteredItems.value.filter((item) => item.category === category);
}

function toggleCategory(category: string) {
  if (selectedCategories.value.has(category)) {
    selectedCategories.value.delete(category);
  } else {
    selectedCategories.value.add(category);
  }
}

function toggleExpand(itemName: string) {
  if (expandedCards.value.has(itemName)) {
    expandedCards.value.delete(itemName);
  } else {
    expandedCards.value.add(itemName);
  }
}

function getCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
</script>

<style scoped>
.cheat-sheet {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.controls {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  max-width: 400px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.search-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.category-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.category-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.category-section {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  overflow: hidden;
  position: relative;
}

.category-section::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
}

.category-section.category-chart-syntax::before {
  background: #3b82f6;
}

.category-section.category-coordinate-transforms::before {
  background: #8b5cf6;
}

.category-section.category-data-utilities::before {
  background: #10b981;
}

.category-section.category-legacy-shapes-marks::before {
  background: #f59e0b;
}

.category-section.category-legacy-graphical-operators::before {
  background: #ef4444;
}

.category-section.category-main-api::before {
  background: #06b6d4;
}

.category-section.category-utilities::before {
  background: #ec4899;
}

.category-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--vp-c-bg-soft);
}

.category-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.category-count {
  font-size: 12px;
  color: var(--vp-c-text-2);
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.card {
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--vp-c-border);
  transition: width 0.2s;
}

.card:hover::before {
  width: 4px;
}

.card:hover {
  border-color: var(--vp-c-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card.expanded {
  border-color: var(--vp-c-brand);
}

.card.expanded::before {
  width: 4px;
}

/* Category color coding for cards */
.card.category-chart-syntax::before {
  background: #3b82f6;
}

.card.category-coordinate-transforms::before {
  background: #8b5cf6;
}

.card.category-data-utilities::before {
  background: #10b981;
}

.card.category-legacy-shapes-marks::before {
  background: #f59e0b;
}

.card.category-legacy-graphical-operators::before {
  background: #ef4444;
}

.card.category-main-api::before {
  background: #06b6d4;
}

.card.category-utilities::before {
  background: #ec4899;
}

.card-category-bar {
  height: 3px;
  width: 100%;
  margin-bottom: 0.75rem;
}

.card-category-bar.category-chart-syntax {
  background: #3b82f6;
}

.card-category-bar.category-coordinate-transforms {
  background: #8b5cf6;
}

.card-category-bar.category-data-utilities {
  background: #10b981;
}

.card-category-bar.category-legacy-shapes-marks {
  background: #f59e0b;
}

.card-category-bar.category-legacy-graphical-operators {
  background: #ef4444;
}

.card-category-bar.category-main-api {
  background: #06b6d4;
}

.card-category-bar.category-utilities {
  background: #ec4899;
}

.card-header {
  flex: 1;
  padding: 0.75rem;
}

.card-title-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-brand);
  font-family: var(--vp-font-family-mono);
}

.card-snippet {
  margin: 0.5rem 0;
  font-size: 11px;
  line-height: 1.4;
}

.card-snippet code {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  padding: 0.25rem 0.375rem;
  border-radius: 3px;
  display: block;
  white-space: pre-wrap;
  word-break: break-all;
}

.card-params {
  margin-top: 0.5rem;
  font-size: 10px;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.params-label {
  font-weight: 500;
}

.params-list {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}

.card-expanded {
  margin-top: 0;
  padding: 0.75rem;
  padding-top: 0;
  border-top: 1px solid var(--vp-c-border);
}

.card-example {
  max-height: 400px;
  overflow: auto;
}

.card-example :deep(.gofish-vue) {
  transform: scale(0.6);
  transform-origin: top left;
}
</style>
