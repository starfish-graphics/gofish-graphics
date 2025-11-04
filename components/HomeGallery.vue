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
  grid-template-columns: repeat(6, 1fr);
  /* gap: 12px; */
  /* margin-top: -20px; */
  width: 85vw;
  /* align content of grid block to center */
  justify-content: center;
  /* center the entire grid block */
  /* margin-left: auto; */
  /* margin-right: auto; */
  /* width: 100%; */
  /* max-width: 1400px; */
  border: 1px solid #4cb05e;
  border-radius: 8px;
}

/* on mobile, make the grid a single column and remove magins */
@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: 1fr;
    margin-top: 500px !important;
    margin-left: 0 !important;
    padding-left: 0 !important;
    width: 70vw !important;
  }
}

.example-card {
  /* border-bottom: 1px solid var(--vp-c-border); */
  /* border-right: 1px solid #4cb05e; */
  /* border-radius: 8px; */
  overflow: hidden;
  /* background: var(--vp-c-bg); */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  /* important to override the margin-left: 0; padding-left: 0; in the GoFishVue component */
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
  /* background: var(--vp-c-bg-soft); */
  background: #4cb05e08;
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
  padding: 8px;
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
