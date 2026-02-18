<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as gf from "gofish-graphics";
import { mix } from "spectral.js";
import _ from "lodash";
import { streamgraphData } from "./data/streamgraphData";
import { titanic } from "./data/titanic";
import { nightingale } from "./data/nightingale";
import { drivingShifts } from "./data/drivingShifts";
import { newCarColors } from "./data/newCarColors";
import { caltrain, caltrainStopOrder } from "./data/caltrain";
import { penguins } from "./data/penguins";
import { density1d } from "fast-kde";
import { genderPayGap, payGrade } from "./data/genderPayGap";
import { seafood, lakeLocations } from "./data/seafood";

const props = defineProps<{
  code: string;
  transform?: string;
}>();

const container = ref<HTMLElement | null>(null);
const {
  GoFish,
  StackX,
  StackY,
  rect,
  value,
  Ref,
  ConnectX,
  Frame,
  Ellipse,
  Stack,
  coord,
  polar_DEPRECATED,
  color,
  black,
  Rect,
  For,
  v,
  groupBy,
  ConnectY,
  color6_old,
  white,
  wavy,
  color6,
  Petal,
  sumBy,
  orderBy,
  polar,
  gray,
  neutral,
  Enclose,
  Chart,
  Spread,
  spread,
  derive,
  Layer,
  select,
  line,
  scaffold,
  area,
  circle,
  group,
  normalize,
  repeat,
  scatter,
  clock,
} = gf;
const gofishRef = Ref;
const gofish = GoFish;
const stackX = StackX;
const stackY = StackY;
const connectX = ConnectX;
const frame = Frame;
const ellipse = Ellipse;
const stack = Stack;
const chart = Chart;
const layer = Layer;
const Polar_DEPRECATED = polar_DEPRECATED;
const Wavy = wavy;
const Polar = polar;

onMounted(() => {
  if (!container.value) return;

  try {
    // Create a scoped sandbox
    const fn = new Function(
      "_",
      "root",
      "size",
      "gf",
      "streamgraphData",
      "titanic",
      "nightingale",
      "StackX",
      "StackY",
      "rect",
      "Rect",
      "For",
      "v",
      "Frame",
      "ConnectX",
      "ConnectY",
      "Ref",
      "groupBy",
      "Polar_DEPRECATED",
      "drivingShifts",
      "Ellipse",
      "newCarColors",
      "caltrain",
      "caltrainStopOrder",
      "penguins",
      "density1d",
      "genderPayGap",
      "payGrade",
      "mix",
      "color6_old",
      "white",
      "black",
      "color",
      "seafood",
      "lakeLocations",
      "Wavy",
      "Polar",
      "color6",
      "Petal",
      "sumBy",
      "orderBy",
      "polar",
      "gray",
      "neutral",
      "Enclose",
      // New API symbols available to example code
      "Chart",
      "chart",
      "Spread",
      "spread",
      "stack",
      "derive",
      "Layer",
      "layer",
      "select",
      "line",
      "scaffold",
      "area",
      "circle",
      "group",
      "normalize",
      "repeat",
      "scatter",
      "clock",
      props.code
    );
    const root = document.createElement("div");
    const size = { width: 500, height: 300 }; // default size
    fn(
      _,
      root,
      size,
      {
        render: gofish,
        stackX,
        stackY,
        rect,
        value,
        ref: gofishRef,
        connectX,
        frame,
        ellipse,
        stack,
        coord,
        polar_DEPRECATED,
        color,
        black,
        map: (data, callback) => data.map(callback),
      },
      streamgraphData,
      titanic,
      nightingale,
      StackX,
      StackY,
      rect,
      Rect,
      For,
      v,
      Frame,
      ConnectX,
      ConnectY,
      Ref,
      groupBy,
      Polar_DEPRECATED,
      drivingShifts,
      Ellipse,
      newCarColors,
      caltrain,
      caltrainStopOrder,
      penguins,
      density1d,
      genderPayGap,
      payGrade,
      mix,
      color6_old,
      white,
      black,
      color,
      seafood,
      lakeLocations,
      Wavy,
      Polar,
      color6,
      Petal,
      sumBy,
      orderBy,
      polar,
      gray,
      neutral,
      Enclose,
      // New API symbol values
      Chart,
      chart,
      Spread,
      spread,
      stack,
      derive,
      Layer,
      layer,
      select,
      line,
      scaffold,
      area,
      circle,
      group,
      normalize,
      repeat,
      scatter,
      clock
    );
    container.value.append(root);
  } catch (err) {
    console.error("GoFish execution failed:", err);
    container.value.textContent = "⚠️ Error rendering GoFish block.";
  }
});
</script>

<template>
  <div class="gofish-vue" :style="{ transform: transform }">
    <div ref="container" />
  </div>
</template>

<style scoped>
.gofish-vue {
  padding-bottom: 1rem;
  transform-origin: center center;
}
</style>
