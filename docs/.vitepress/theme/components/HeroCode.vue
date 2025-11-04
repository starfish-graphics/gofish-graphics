<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { chart, spread, stack, derive, layer, select, rect, area, foreach, clock } from 'gofish-graphics'
import _ from 'lodash'
const { orderBy } = _

const rootEl = ref<HTMLElement | null>(null)
const copied = ref(false)
const installCmd = 'npm install gofish-graphics'
const chartWidth = ref(500)
const chartHeight = ref(300)

const seafood = [
  { lake: 'Lake A', species: 'Bass', count: 23 },
  { lake: 'Lake A', species: 'Trout', count: 31 },
  { lake: 'Lake A', species: 'Catfish', count: 29 },
  { lake: 'Lake A', species: 'Perch', count: 12 },
  { lake: 'Lake A', species: 'Salmon', count: 8 },
  { lake: 'Lake B', species: 'Bass', count: 25 },
  { lake: 'Lake B', species: 'Trout', count: 34 },
  { lake: 'Lake B', species: 'Catfish', count: 41 },
  { lake: 'Lake B', species: 'Perch', count: 21 },
  { lake: 'Lake B', species: 'Salmon', count: 16 },
  { lake: 'Lake C', species: 'Bass', count: 15 },
  { lake: 'Lake C', species: 'Trout', count: 25 },
  { lake: 'Lake C', species: 'Catfish', count: 31 },
  { lake: 'Lake C', species: 'Perch', count: 22 },
  { lake: 'Lake C', species: 'Salmon', count: 31 },
  { lake: 'Lake D', species: 'Bass', count: 12 },
  { lake: 'Lake D', species: 'Trout', count: 17 },
  { lake: 'Lake D', species: 'Catfish', count: 23 },
  { lake: 'Lake D', species: 'Perch', count: 23 },
  { lake: 'Lake D', species: 'Salmon', count: 41 },
  { lake: 'Lake E', species: 'Bass', count: 7 },
  { lake: 'Lake E', species: 'Trout', count: 9 },
  { lake: 'Lake E', species: 'Catfish', count: 13 },
  { lake: 'Lake E', species: 'Perch', count: 20 },
  { lake: 'Lake E', species: 'Salmon', count: 40 },
  { lake: 'Lake F', species: 'Bass', count: 4 },
  { lake: 'Lake F', species: 'Trout', count: 7 },
  { lake: 'Lake F', species: 'Catfish', count: 9 },
  { lake: 'Lake F', species: 'Perch', count: 21 },
  { lake: 'Lake F', species: 'Salmon', count: 47 }
]

const code = `layer({ coord: clock() }, [
  chart(seafood)
    .flow(
      spread("lake", {
        dir: "x",
        spacing: (2 * Math.PI) / 6,
        mode: "center",
        y: 50,
        label: false,
      }),
      derive((d) => orderBy(d, "count", "asc")),
      stack("species", { dir: "y", label: false })
    )
    .mark(rect({ w: 0.1, h: "count", fill: "species" }))
    .as("bars"),
  chart(select("bars"))
    .flow(foreach("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, { w: 500, h: 300, transform: { x: 200, y: 200 }, axes: true });`

function escapeHtml(src: string): string {
  return src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightTs(src: string): string {
  let s = escapeHtml(src)

  // Strings
  s = s.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span class="tok-str">$1</span>')
  // Keywords
  s = s.replace(/\b(import|from|const|let|return|new|export|function|if|else|await|async)\b/g, '<span class="tok-kw">$1</span>')
  // Numbers
  s = s.replace(/\b(0x[\da-fA-F]+|\d+)(?![\w])/g, '<span class="tok-num">$1</span>')
  // Methods (simple heuristic: dot followed by ident)
  s = s.replace(/\.(\w+)\b/g, '.<span class="tok-fn">$1</span>')
  // Object keys inside { } (heuristic)
  s = s.replace(/\{([^}]+)\}/g, (m, inner) => {
    const highlighted = inner.replace(/\b([a-zA-Z_][\w]*)\b(?=\s*:)/g, '<span class="tok-prop">$1</span>')
    return '{' + highlighted + '}'
  })
  return s
}

const highlighted = computed(() => highlightTs(code))

function updateChartDimensions() {
  const root = rootEl.value
  if (!root) return
  
  // Get the actual container width, including padding
  const container = root.parentElement
  const containerWidth = container 
    ? Math.min(container.clientWidth - 16, 640) // Subtract padding
    : Math.min(window.innerWidth - 32, 640) // Fallback with margin
  
  // Use container width, ensuring it's at least 300px for very small screens
  const availableWidth = Math.max(containerWidth, 300)
  
  // Maintain aspect ratio (500:300 = 5:3)
  chartWidth.value = availableWidth
  chartHeight.value = (availableWidth * 300) * 0.8 / 500
  
  // Re-render chart with new dimensions
  root.innerHTML = ''
  const centerX = chartWidth.value / 2
  const centerY = chartHeight.value / 2
  
  layer({ coord: clock() }, [
    chart(seafood)
      .flow(
        spread('lake', {
          dir: 'x',
          spacing: (2 * Math.PI) / 6,
          mode: 'center',
          y: 50,
          label: false,
        }),
        derive((d) => orderBy(d, 'count', 'asc')),
        stack('species', { dir: 'y', label: false })
      )
      .mark(rect({ w: 0.1, h: 'count', fill: 'species' }))
      .as('bars'),
    chart(select('bars'))
      .flow(foreach('species'))
      .mark(area({ opacity: 0.8 })),
  ]).render(root, { 
    w: chartWidth.value, 
    h: chartHeight.value, 
    transform: { x: centerX, y: centerY }, 
    axes: true 
  })
  
  // Ensure SVG is constrained to container width
  const svg = root.querySelector('svg')
  if (svg) {
    svg.style.width = '100%'
    svg.style.height = 'auto'
    svg.style.maxWidth = `${chartWidth.value}px`
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  // Wait for next tick to ensure container is properly sized
  setTimeout(() => {
    updateChartDimensions()
    
    // Observe container size changes - observe parent container for better width detection
    const container = rootEl.value?.parentElement
    if (container && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateChartDimensions()
      })
      resizeObserver.observe(container)
    }
    
    // Fallback for browsers without ResizeObserver
    window.addEventListener('resize', updateChartDimensions)
  }, 0)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', updateChartDimensions)
})

async function copyInstall() {
  try {
    await navigator.clipboard.writeText(installCmd)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch (_) {
    const ta = document.createElement('textarea')
    ta.value = installCmd
    ta.setAttribute('readonly', '')
    ta.style.position = 'absolute'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}
</script>

<template>
  <div class="hero-snippet">
    <div class="install-pill" role="button" aria-label="Copy install command" @click="copyInstall">
      <code class="cmd">npm install <span class="gofish-graphics">gofish-graphics</span></code>
      <span class="copy">{{ copied ? 'Copied' : 'Copy' }}</span>
    </div>
    <div ref="rootEl" class="viz"></div>
    <pre class="code"><code class="language-ts" v-html="highlighted"></code></pre>
  </div>
</template>

<style scoped>
.hero-snippet {
  padding: 8px;
  display: grid;
  gap: 12px;
  margin-left: auto;
  width: min(640px, 100%);
}
.gofish-graphics {
  color: #4cb05e;
}

.install-pill {
  display: block;
  font-weight: 700;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  background-color: var(--vp-c-brand-soft);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.25rem;
  display: inline-flex;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.05s ease;
  /* width: 100%; */
  width: 100%;
  margin-top: 2rem;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.05s ease;
  justify-content: space-between;
  margin-top: 2rem;
}

.install-pill:hover {
  background: var(--vp-c-default-soft);
}

.install-pill:active {
  transform: translateY(1px);
}

.install-pill .cmd {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-1);
}

.install-pill .copy {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.viz {
  width: 100%;
  max-width: 640px;
  aspect-ratio: 5 / 3;
  border-radius: 12px;
  display: block;
  overflow: hidden;
}

.viz :deep(svg) {
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
}

@media (max-width: 640px) {
  .viz {
    aspect-ratio: 5 / 3;
    height: auto;
    max-width: 100%;
  }
  
  .viz :deep(svg) {
    width: 100% !important;
    max-width: 100% !important;
  }
}

.code {
  margin: 0;
  padding: 16px;
  background: var(--vp-code-block-bg, var(--vp-code-bg));
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: auto;
}

.code code {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre;
  display: block;
}

/* Token colors harmonized to example theme */
/* Use deep selectors so styles apply to v-html content */
:deep(.tok-kw) {
  color: var(--vp-c-purple-2, #7348c2);
}

:deep(.tok-str) {
  color: var(--vp-c-green-2, #a5e075);
}

:deep(.tok-num) {
  color: var(--vp-c-orange-2, #025cc5);
}

:deep(.tok-fn) {
  color: var(--vp-c-blue-2, #7348c2);
}

:deep(.tok-prop) {
  color: var(--vp-c-cyan-2, #000);
}

/* Entrance animation: slide up + fade in */
@keyframes slideFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-snippet .viz {
  animation: slideFadeUp 600ms ease-out both;
}

.hero-snippet .code {
  animation: slideFadeUp 700ms ease-out both;
  animation-delay: 120ms;
}

.hero-snippet .install-pill {
  animation: slideFadeUp 500ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .hero-snippet .viz,
  .hero-snippet .code {
    animation: none !important;
  }
}
</style>
