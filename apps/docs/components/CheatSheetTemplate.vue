<script setup lang="ts">
type UsageEntry = {
  description: string;
  example?: string;
};

type ComponentEntry = {
  type: string;
  description: string;
};

export type DescriptionJson = {
  name: string;
  description: string;
  usage?: Record<string, UsageEntry>;
  components: Record<string, ComponentEntry>;
};

const props = defineProps<{
  data: DescriptionJson;
}>();

const usageEntries = props.data.usage ?? {};
const components = Object.entries(props.data.components ?? {}) as [
  string,
  ComponentEntry,
][];

// Eagerly import all SVG icons in the directory and index them by filename.
const iconModules = import.meta.glob(
  '../../../docs/descriptions/icons/*.svg',
  { eager: true, as: 'url' },
) as Record<string, string>;

const getIconForType = (type: string) => {
  const key = `../../../docs/descriptions/icons/${type}.svg`;
  return iconModules[key] ?? '';
};
</script>

<template>
  <section class="cheat-sheet">
    <header class="cheat-sheet__header">
      <h1 class="cheat-sheet__title">
        {{ props.data.name }}
      </h1>
      <p class="cheat-sheet__subtitle">
        {{ props.data.description }}
      </p>
    </header>

    <section v-if="Object.keys(usageEntries).length" class="cheat-sheet__usage">
      <h2 class="cheat-sheet__section-title">
        Usage
      </h2>
      <div class="cheat-sheet__usage-grid">
        <article
          v-for="(entry, key) in usageEntries"
          :key="key"
          class="cheat-sheet__usage-item"
        >
          <h3 class="cheat-sheet__usage-key">
            {{ key }}
          </h3>
          <p class="cheat-sheet__usage-description">
            {{ entry.description }}
          </p>
          <pre v-if="entry.example" class="cheat-sheet__usage-example">
<code>{{ entry.example }}</code>
          </pre>
        </article>
      </div>
    </section>

    <section class="cheat-sheet__components">
      <h2 class="cheat-sheet__section-title">
        Components
      </h2>
      <div class="cheat-sheet__card-grid">
        <article
          v-for="[name, component] in components"
          :key="name"
          class="cheat-sheet__card"
        >
          <div class="cheat-sheet__card-header">
            <img
              v-if="getIconForType(component.type)"
              :src="getIconForType(component.type)"
              :alt="`${name} icon`"
              class="cheat-sheet__icon"
            >
            <div class="cheat-sheet__card-title-group">
              <h3 class="cheat-sheet__card-title">
                {{ name }}
              </h3>
              <p class="cheat-sheet__card-type">
                Type: <span>{{ component.type }}</span>
              </p>
            </div>
          </div>

          <p class="cheat-sheet__card-description">
            {{ component.description }}
          </p>

          <footer class="cheat-sheet__card-footer">
            <p class="cheat-sheet__card-meta">
              Uses the general usage patterns described above.
            </p>
          </footer>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.cheat-sheet {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
}

.cheat-sheet__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cheat-sheet__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.cheat-sheet__subtitle {
  margin: 0;
  color: #555;
  max-width: 48rem;
}

.cheat-sheet__section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.cheat-sheet__usage {
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 1.25rem;
  background: #fafafa;
}

.cheat-sheet__usage-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cheat-sheet__usage-item {
  padding: 0.75rem 0.5rem;
}

.cheat-sheet__usage-key {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.cheat-sheet__usage-description {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #444;
}

.cheat-sheet__usage-example {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  overflow-x: auto;
}

.cheat-sheet__usage-example code {
  font-family: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.cheat-sheet__components {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cheat-sheet__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.cheat-sheet__card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.cheat-sheet__card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cheat-sheet__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.cheat-sheet__card-title-group {
  display: flex;
  flex-direction: column;
}

.cheat-sheet__card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.cheat-sheet__card-type {
  margin: 0;
  font-size: 0.85rem;
  color: #555;
}

.cheat-sheet__card-type span {
  font-family: Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.cheat-sheet__card-description {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
}

.cheat-sheet__card-footer {
  margin-top: auto;
}

.cheat-sheet__card-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}
</style>

