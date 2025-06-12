<script setup lang="ts">
import { onMounted, ref } from "vue";
import { gofish, stackX, rect, value } from "gofish-graphics";

const props = defineProps<{
  code: string;
}>();

const container = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!container.value) return;

  try {
    // Create a scoped sandbox
    const fn = new Function(
      "root",
      "size",
      "gofish",
      "stackX",
      "rect",
      "value",
      props.code
    );
    const root = document.createElement("div");
    const size = { width: 688, height: 400 }; // or dynamic
    fn(root, size, gofish, stackX, rect, value);
    container.value.append(root);
  } catch (err) {
    console.error("GoFish execution failed:", err);
    container.value.textContent = "⚠️ Error rendering GoFish block.";
  }
});
</script>

<template>
  <div class="gofish-vue">
    <div ref="container" />
  </div>
</template>

<style scoped>
.gofish-vue {
  padding-bottom: 1rem;
}
</style>
