<template>
  <div class="gallery-grid">
    <div v-for="example in examples" :key="example.id" class="example-card">
      <a :href="example.demoUrl + '.html'" class="card-link">
        <div class="card-thumbnail">
          <GoFishVue
            :code="example.code"
            :transform="`scale(${scaleFactor}, ${
              scaleFactor * aspectRatioTransform
            }) translate(100px, 0px)`"
          />
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import GoFishVue from "./GoFishVue.vue";
import { data as examplesData } from "../docs/.vitepress/data/examples.data.js";
import { onMounted, ref } from "vue";

const scaleFactor = 0.35;
const aspectRatioTransform = 16 / 10 / (688 / 400);

const examples = ref([]);

onMounted(() => {
  examples.value = examplesData.examples;
});
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
  margin-top: -20px;
}

.example-card {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.card-thumbnail {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-thumbnail :deep(.gofish-vue) {
  transform-origin: center center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-thumbnail :deep(.gofish-vue .container) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  padding: 16px;
  font-weight: 400;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.card-description {
  margin: 0 0 16px 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
