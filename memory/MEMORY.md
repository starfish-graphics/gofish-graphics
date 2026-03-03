# GoFish Graphics - Memory

## Project Structure
- Monorepo: `packages/gofish-graphics/` (main lib), `apps/docs/`, `packages/gofish-python/`
- pnpm store: `/Users/jmp/Library/pnpm/store/v10`
- Dev server: port 3000 (`pnpm dev`), Storybook: port 6006 (`pnpm storybook`)

## Key Files
- Main lib exports: `packages/gofish-graphics/src/lib.ts`
- v3 chart API: `packages/gofish-graphics/src/ast/marks/chart.ts`
- Rect shape: `packages/gofish-graphics/src/ast/shapes/rect.tsx`
- Seafood sample data: `packages/gofish-graphics/src/data/catch.ts`
- Stories: `packages/gofish-graphics/stories/`
- Vega-Lite stories: `packages/gofish-graphics/stories/vega-lite/`

## v3 Chart API Pattern
```ts
Chart(data)
  .flow(spread("field", { dir: "x" | "y" }), stack("field", { dir: "x" | "y" }), derive(fn))
  .mark(rect({ h: "field", fill: "field", rx: 3 }))
  .render(container, { w, h, axes: true })
```
- `derive(fn)` transforms data before next operator (first in flow = runs before spread)
- After `spread()`, `d` in derive is scoped to one x-group — use this to compute per-group totals (e.g. `sumBy(d, "field")`) without manual groupBy
- Filter static subsets before `Chart()` rather than inside `derive()`
- `rect()` passes unknown props through to `Rect()` (so `rx`/`ry` work)

## Vega-Datasets
- Added as devDependency to `packages/gofish-graphics`, along with `d3-dsv` and `@types/d3-dsv`
- Do NOT use the fetch-based API (`import data from "vega-datasets"`) — causes Vite module resolution errors with d3-dsv
- Import JSON directly (Vite handles natively): `import population from "vega-datasets/data/population.json"`
- Import CSV as raw string + parse: `import raw from "vega-datasets/data/seattle-weather.csv?raw"` then `csvParse(raw, autoType)` from `d3-dsv`
- d3-dsv `autoType` parses ISO date strings to Date objects, numeric strings to numbers
- Available: population.json, barley.json, seattle-weather.csv, movies.json, etc.

## Vega-Lite Bar Chart Stories Created
All in `stories/vega-lite/`:
- `SimpleBarChart.stories.tsx` - simple bar (existing)
- `AggregateBarChart.stories.tsx` - population by age (horizontal), derive+groupBy+sumBy
- `AggregateBarChartSorted.stories.tsx` - same, sorted desc by value
- `GroupedBarChart.stories.tsx` - inline A/B/C data, spread+stack
- `GroupedBarChartRepeat.stories.tsx` - movies.json, wide-to-long reshape in derive
- `StackedBarChart.stories.tsx` - seattle-weather.csv, derive to month+count
- `StackedBarChartRounded.stories.tsx` - same + rx/ry on rect
- `HorizontalStackedBarChart.stories.tsx` - barley.json, spread(variety,y)+stack(site,x)
- `NormalizedStackedBarChart.stories.tsx` - population.json yr2000, spread(age,x)+derive(proportion per row)+stack(sex,y)

## place() API (post-refactor)
- New signature: `place(axis: FancyDirection, value: number, anchor?: Anchor)`
- Anchors: `"min"` (default), `"max"`, `"center"`, `"baseline"`
- `"baseline"` anchor = places **local origin (0)** at value → `translate = value`. This replicates old `place({ x: value })` behavior.
- `"min"` anchor = places min corner at value → `translate = value - intrinsicDims.min`. DIFFERENT from old for composite nodes where min≠0.
- **Rule**: operators that co-locate children in a shared coordinate space (layer, enclose, porterDuff, coord, gofish root) MUST use `"baseline"` anchor, not `"min"`. Using `"min"` shifts composite nodes with non-zero min, breaking Ref-based layouts.
- Spread's distribute/align passes correctly use `"min"`, `"center"`, `"max"`, `"baseline"` anchors per their alignment semantics.

## Missing Features (catalogued in stories)
1. **Custom color palettes/ranges** - Vega-Lite maps field values to specific colors; GoFish auto-assigns
2. **Per-corner border radius** - Vega-Lite has cornerRadiusTopLeft/TopRight; GoFish `rx`/`ry` applies to all corners
3. **Built-in repeat.layer / pivot** - Vega-Lite `repeat.layer` creates multi-measure charts declaratively; GoFish requires manual wide-to-long reshape with `derive()`
4. **Declarative aggregation** - Vega-Lite has `aggregate: "sum"/"count"` in encodings; GoFish uses `derive()` + lodash groupBy/sumBy

## Story Pattern for Async Data
```ts
render: (args) => {
  const container = initializeContainer();
  data['dataset.json']().then((rows: any[]) => {
    Chart(rows).flow(...).mark(...).render(container, {...});
  });
  return container; // returned synchronously; chart fills in async
}
```
