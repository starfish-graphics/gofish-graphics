<template>
  <div class="example-gallery">
    <!-- Search and Filter Controls -->
    <div class="gallery-controls">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search examples..."
          class="search-input"
        />
      </div>

      <!-- <div class="filter-section">
        <div class="filter-group">
          <label>Marks:</label>
          <div class="tag-filters">
            <button
              v-for="mark in availableMarks"
              :key="mark"
              :class="['tag-filter', { active: selectedMarks.includes(mark) }]"
              @click="toggleFilter('marks', mark)"
            >
              {{ mark }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>Operators:</label>
          <div class="tag-filters">
            <button
              v-for="operator in availableOperators"
              :key="operator"
              :class="[
                'tag-filter',
                { active: selectedOperators.includes(operator) },
              ]"
              @click="toggleFilter('operators', operator)"
            >
              {{ operator }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>Chart Types:</label>
          <div class="tag-filters">
            <button
              v-for="chartType in availableChartTypes"
              :key="chartType"
              :class="[
                'tag-filter',
                { active: selectedChartTypes.includes(chartType) },
              ]"
              @click="toggleFilter('chartTypes', chartType)"
            >
              {{ chartType }}
            </button>
          </div>
        </div>
      </div>

      <button @click="clearAllFilters" class="clear-filters">
        Clear All Filters
      </button> -->
    </div>

    <!-- Results Count -->
    <div class="results-info">
      Showing {{ filteredExamples.length }} of {{ examples.length }} examples
    </div>

    <!-- Gallery Grid -->
    <div class="gallery-grid">
      <div
        v-for="example in filteredExamples"
        :key="example.id"
        class="example-card"
      >
        <a :href="example.demoUrl + '.html'" class="card-link">
          <div class="card-thumbnail">
            <GoFishVue
              :code="example.code"
              :transform="`scale(${scaleFactor}, ${
                scaleFactor * aspectRatioTransform
              })`"
            />
          </div>

          <div class="card-content">
            <h3 class="card-title">{{ example.title }}</h3>
            <p class="card-description">{{ example.description }}</p>
          </div>
        </a>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-if="filteredExamples.length === 0" class="no-results">
      <p>No examples match your current filters.</p>
      <button @click="clearAllFilters" class="clear-filters">
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { data as examplesData } from "../docs/.vitepress/data/examples.data.js";
import GoFishVue from "./GoFishVue.vue";

const examples = ref([]);
const searchQuery = ref("");
// const selectedMarks = ref([]);
// const selectedOperators = ref([]);
// const selectedChartTypes = ref([]);

// Get all available filter options
const availableMarks = computed(() => {
  const marks = new Set();
  examples.value.forEach((example) => {
    example.tags.marks.forEach((mark) => marks.add(mark));
  });
  return Array.from(marks).sort();
});

const availableOperators = computed(() => {
  const operators = new Set();
  examples.value.forEach((example) => {
    example.tags.operators.forEach((operator) => operators.add(operator));
  });
  return Array.from(operators).sort();
});

const availableChartTypes = computed(() => {
  const chartTypes = new Set();
  examples.value.forEach((example) => {
    example.tags.chartTypes.forEach((type) => chartTypes.add(type));
  });
  return Array.from(chartTypes).sort();
});

// Filter examples based on search and selected filters
const filteredExamples = computed(() => {
  return examples.value.filter((example) => {
    // Text search
    const matchesSearch =
      searchQuery.value === "" ||
      example.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (example.description &&
        example.description
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase())); /* ||
      example.tags.marks.some((tag) =>
        tag.toLowerCase().includes(searchQuery.value.toLowerCase())
      ) ||
      example.tags.operators.some((tag) =>
        tag.toLowerCase().includes(searchQuery.value.toLowerCase())
      ) ||
      example.tags.chartTypes.some((tag) =>
        tag.toLowerCase().includes(searchQuery.value.toLowerCase())
      ); */

    // // Tag filters
    // const matchesMarks =
    //   selectedMarks.value.length === 0 ||
    //   selectedMarks.value.some((mark) => example.tags.marks.includes(mark));

    // const matchesOperators =
    //   selectedOperators.value.length === 0 ||
    //   selectedOperators.value.some((operator) =>
    //     example.tags.operators.includes(operator)
    //   );

    // const matchesChartTypes =
    //   selectedChartTypes.value.length === 0 ||
    //   selectedChartTypes.value.some((type) =>
    //     example.tags.chartTypes.includes(type)
    //   );

    return matchesSearch /* && matchesMarks && matchesOperators && matchesChartTypes */;
  });
});

// Toggle filter selection
const toggleFilter = (filterType, value) => {
  const filterArray =
    filterType === "marks"
      ? selectedMarks
      : filterType === "operators"
      ? selectedOperators
      : selectedChartTypes;

  const index = filterArray.value.indexOf(value);
  if (index > -1) {
    filterArray.value.splice(index, 1);
  } else {
    filterArray.value.push(value);
  }
};

// Clear all filters
const clearAllFilters = () => {
  searchQuery.value = "";
  selectedMarks.value = [];
  selectedOperators.value = [];
  selectedChartTypes.value = [];
};

onMounted(() => {
  examples.value = examplesData.examples;
});

const scaleFactor = 0.28;
const aspectRatioTransform = 16 / 10 / (688 / 400);
</script>

<style scoped>
.example-gallery {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: block;
}

.gallery-controls {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.search-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  /* margin-bottom: 20px; */
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
  color: var(--vp-c-text-1);
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-filter {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.tag-filter:hover {
  background: var(--vp-c-brand-light);
}

.tag-filter.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.clear-filters {
  margin-top: 15px;
  padding: 8px 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  cursor: pointer;
}

.results-info {
  margin-bottom: 20px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
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
  margin-left: 0px;
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

.card-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-right: 4px;
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.mark-tag {
  background: #e3f2fd;
  color: #1565c0;
}

.operator-tag {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-tag {
  background: #e8f5e8;
  color: #2e7d32;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: var(--vp-c-text-2);
}

@media (max-width: 768px) {
  .filter-section {
    gap: 12px;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .tag-filters {
    gap: 6px;
  }

  .tag-filter {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>
