# GoFish: Composable Visualization from Python — PyData 2026

A 30+15 min conference talk introducing GoFish to Python data practitioners.

## Running the presentation

```bash
# From the monorepo root
pnpm presentation:dev

# Or from this directory
pnpm dev
```

Opens at **http://localhost:4000**. Navigate with arrow keys; press `S` for speaker notes.

## Editing

### Slide content — `index.html`

Each `<section>` is one slide. Slides with live charts use a `.two-col` layout:

```html
<div class="two-col">
  <div class="col-code">
    <pre><code class="language-python">...</code></pre>
  </div>
  <div class="col-chart">
    <div id="chart-bar" class="chart-container"></div>
  </div>
</div>
```

Python code blocks are display-only (syntax-highlighted). The live chart next to each one renders the equivalent GoFish TypeScript via `charts.ts`.

Speaker notes go in `<aside class="notes">...</aside>` inside each `<section>`.

### Live charts — `charts.ts`

Each chart has a named render function keyed to its container `id`:

| Container ID    | Slide | Chart                          |
| --------------- | ----- | ------------------------------ |
| `chart-bar`     | 5     | Basic bar — `spread` + `rect`  |
| `chart-stacked` | 6     | Stacked bar — + `stack`        |
| `chart-pie`     | 8     | Pie via `clock()` coord        |
| `chart-scatter` | 10    | Connected scatter + `select()` |
| `chart-area`    | 11    | Stacked area — scaffold/select |
| `chart-glyphs`  | 13    | Scatter with pie glyphs        |

To add a new chart:

1. Add a `<div id="chart-foo" class="chart-container">` in `index.html`
2. Write a `renderFooChart()` function in `charts.ts`
3. Call it from `renderCharts()` and add an entry to `chartRenderers`

Chart dimensions are controlled by `CHART_W` / `CHART_H` at the top of `charts.ts`.

### Styles — `style.css`

Key layout classes:

- `.two-col` — side-by-side code/chart grid
- `.ladder` / `.ladder-step` — numbered progression boxes
- `.grammar-grid` — two-column term/definition grid
- `.callout` — yellow-bordered emphasis box
- `.ast-box` / `.ast-tree` — AST diagram nodes

### reveal.js config — `main.ts`

Presentation is fixed at 1280×720 with `transition: "none"`. To change theme, swap `white.css` for another file in `node_modules/reveal.js/dist/theme/`.

## Building

```bash
pnpm build      # outputs to dist/
pnpm preview    # serves the built output
```

## Data sources

Charts import directly from the library source (no build step needed):

- `packages/gofish-graphics/src/data/catch.ts` — `seafood`, `catchLocations`
- `packages/gofish-graphics/src/data/drivingShifts.ts` — `drivingShifts`

The vite alias in `vite.config.ts` resolves `gofish-graphics` to `packages/gofish-graphics/src/lib.ts`, so charts always reflect the latest library source.
