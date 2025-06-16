<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  gofish,
  stackX,
  stackY,
  rect,
  value,
  ref as gofishRef,
  connectX,
  frame,
  ellipse,
  stack,
  coord,
  polar_DEPRECATED,
  color,
  black,
} from "gofish-graphics";
import _ from "lodash";
import { catchData } from "./data/catchData";
import { streamgraphData } from "./data/streamgraphData";
import { titanic } from "./data/titanic";

const props = defineProps<{
  code: string;
  transform?: string;
}>();

const container = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!container.value) return;

  try {
    // Create a scoped sandbox
    const fn = new Function(
      "_",
      "root",
      "size",
      "gf",
      "catchData",
      "streamgraphData",
      "titanic",
      props.code
    );
    const root = document.createElement("div");
    const size = { width: 688, height: 400 }; // default size
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
      },
      catchData,
      streamgraphData,
      titanic
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
