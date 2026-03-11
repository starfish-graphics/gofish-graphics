# Scale Params Design Notes

## Proposal: Add `x`, `y`, `color` params to `chart()`

### `color`
Maps a data field to a discrete or continuous palette. Already partially exists via `scaleContext` (cyclic 6-color palette). The param would allow overriding the palette.

### `x` and `y`
Fields are **not** needed here — they're already inferred from how `spread`/`scatter` is set up. These params would only modify *how* the inferred scale behaves:

- **Scale type**: `type: "log" | "linear" | "band"` — currently all sizes scale linearly; no way to do log scale
- **Explicit domain**: `domain: [0, 100]` — currently domain is always inferred from data; useful for cross-chart comparisons

### What's already handled
- Axis rendering (`axes: true` in `.render()`) already auto-generates axes from `spread`/`scatter` key context — no change needed there
- Color assignment already works via field string on marks (e.g. `fill: "category"`)

### Proposed API
```ts
chart(data, {
  x: { type: "band" },
  y: { type: "log" },
  y: { domain: [0, 100] },
  color: { palette: "blues" }
})
```

### How the rendering pipeline works (summary)
- `h: "value"` on a mark → sums that field across data, then scales proportionally to available space (linear by default)
- `fill: "category"` → collects unique values pre-render, assigns colors from cyclic palette, looks up at render time
- Scale factor comes from the layout engine (parent container space / total child sizes)
- `scaleContext` currently only holds the color Map; no x/y scale exists yet
