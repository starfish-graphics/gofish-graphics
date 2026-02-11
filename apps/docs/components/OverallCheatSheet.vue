<script setup lang="ts">
import shapesDataRaw from '../../../docs/descriptions/shapes.json';
import coordDataRaw from '../../../docs/descriptions/coordinate_transforms.json';

type UsageEntry = {
  description: string;
  example?: string;
};

type DescriptionJson = {
  name: string;
  description: string;
  usage?: Record<string, UsageEntry>;
  components?: Record<
    string,
    {
      type: string;
      description: string;
    }
  >;
};

const shapesData = shapesDataRaw as DescriptionJson;
const coordData = coordDataRaw as DescriptionJson;

type OperatorSummary = {
  name: string;
  description: string;
};

type ComponentSummary = {
  name: string;
  type: string;
  description: string;
};

const sections = [
  {
    id: 'shapes',
    title: 'Shapes',
    description: shapesData.description,
    operators: Object.entries(shapesData.usage ?? {}).map(
      ([name, entry]): OperatorSummary => ({
        name,
        description: entry.description,
      }),
    ),
    components: Object.entries(shapesData.components ?? {}).map(
      ([name, entry]): ComponentSummary => ({
        name,
        type: entry.type,
        description: entry.description,
      }),
    ),
    link: '/shapes-cheatsheet',
  },
  {
    id: 'coordinate-transforms',
    title: 'Coordinate Transforms',
    description: coordData.description,
    operators: Object.entries(coordData.usage ?? {}).map(
      ([name, entry]): OperatorSummary => ({
        name,
        description: entry.description,
      }),
    ),
    components: Object.entries(coordData.components ?? {}).map(
      ([name, entry]): ComponentSummary => ({
        name,
        type: entry.type,
        description: entry.description,
      }),
    ),
    link: '/coordinate-transforms-cheatsheet',
  },
];
</script>

<template>
  <section class="overall-cheatsheet">
    <header class="overall-cheatsheet__header">
      <h1 class="overall-cheatsheet__title">
        Cheatsheet Overview
      </h1>
      <p class="overall-cheatsheet__subtitle">
        Compact overview of core GoFish building blocks and their key operators.
      </p>
    </header>

    <div class="overall-cheatsheet__grid">
      <article
        v-for="section in sections"
        :key="section.id"
        class="overall-cheatsheet__card"
      >
        <header class="overall-cheatsheet__card-header">
          <h1 class="overall-cheatsheet__card-title">
            <a
              class="overall-cheatsheet__card-title-link"
              :href="section.link"
            >
              {{ section.title }}
            </a>
          </h1>
        </header>

        <p class="overall-cheatsheet__card-description">
          {{ section.description }}
        </p>

        <section class="overall-cheatsheet__operators">
          <h3 class="overall-cheatsheet__operators-title">
            Operators
          </h3>
          <div class="overall-cheatsheet__operators-list">
            <div
              v-for="op in section.operators"
              :key="op.name"
              class="overall-cheatsheet__operator-item"
            >
              <code class="overall-cheatsheet__operator-name">
                {{ op.name }}
              </code>
              <span class="overall-cheatsheet__operator-description">
                {{ op.description }}
              </span>
            </div>
          </div>
        </section>

        <section
          v-if="section.components?.length"
          class="overall-cheatsheet__components"
        >
          <h3 class="overall-cheatsheet__components-title">
            Components
          </h3>
          <div class="overall-cheatsheet__components-list">
            <div
              v-for="comp in section.components"
              :key="comp.name"
              class="overall-cheatsheet__component-item"
            >
              <code class="overall-cheatsheet__component-name">
                {{ comp.name }}
              </code>
              <span class="overall-cheatsheet__component-meta">
                <!-- <span class="overall-cheatsheet__component-type">
                  {{ comp.type }}
                </span> -->
                <span class="overall-cheatsheet__component-description">
                  {{ comp.description }}
                </span>
              </span>
            </div>
          </div>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.overall-cheatsheet {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
}

.overall-cheatsheet__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.overall-cheatsheet__title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
}

.overall-cheatsheet__subtitle {
  margin: 0;
  max-width: 48rem;
  color: #555;
}

.overall-cheatsheet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.overall-cheatsheet__card {
  border-radius: 0.9rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.overall-cheatsheet__card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
}

.overall-cheatsheet__card-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
}

.overall-cheatsheet__card-title-link {
  font-size: inherit;
  color: inherit;
  text-decoration: none;
}

.overall-cheatsheet__card-title-link:hover {
  text-decoration: underline;
}

.overall-cheatsheet__card-description {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
}

.overall-cheatsheet__operators {
  margin-top: 0.5rem;
}

.overall-cheatsheet__operators-title {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.overall-cheatsheet__operators-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 0.25rem;
}

.overall-cheatsheet__operator-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 0.5rem;
  align-items: baseline;
  font-size: 0.82rem;
}

.overall-cheatsheet__operator-name {
  padding: 0.06rem 0.35rem;
  border-radius: 999px;
  background: #f3f4f6;
}

.overall-cheatsheet__operator-description {
  color: #4b5563;
}

.overall-cheatsheet__components {
  margin-top: 0.75rem;
}

.overall-cheatsheet__components-title {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.overall-cheatsheet__components-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  row-gap: 0.25rem;
}

.overall-cheatsheet__component-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 0.5rem;
  align-items: baseline;
  font-size: 0.8rem;
}

.overall-cheatsheet__component-name {
  padding: 0.06rem 0.35rem;
  border-radius: 999px;
  background: #eef2ff;
}

.overall-cheatsheet__component-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  color: #4b5563;
}

.overall-cheatsheet__component-type {
  font-family: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.overall-cheatsheet__component-description {
  color: #6b7280;
}
</style>

