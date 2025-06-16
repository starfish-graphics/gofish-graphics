<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gofish, stackX, stackY, rect, value } from "gofish-graphics";
import _ from "lodash";

const props = defineProps<{
  code: string;
  transform?: string;
}>();

const container = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!container.value) return;

  try {
    // Create a scoped sandbox
    const fn = new Function("_", "root", "size", "gf", props.code);
    const root = document.createElement("div");
    const size = { width: 688, height: 400 }; // default size
    fn(_, root, size, {
      render: gofish,
      stackX,
      stackY,
      rect,
      value,
    });
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
