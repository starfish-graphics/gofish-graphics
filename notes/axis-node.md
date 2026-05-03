# Node-Based Axis Rendering

Axes are GoFishNodes created during layout, not SVG overlays in gofish.tsx.

## Pipeline

```
resolveColorScale → resolveNames → resolveKeys → resolveLabels
→ resolveUnderlyingSpace
→ resolveAxes        top-down walk; marks axis_x/axis_y on claiming nodes
→ resolveNiceDomains applies d3.nice() to all POSITION domains in-place
→ layout             axis budgeting + axis child creation
→ place
→ INTERNAL_render    axis children injected into spread's child array
```

## Key Design Decisions

### resolveAxes

Top-down. First unclaimed node with POSITION/DIFFERENCE/ORDINAL space claims that dim and sets `axis_x/y = true`. Layer nodes pass through without claiming. Manual `axis: false/true` on any operator overrides inference **and** claims the dim (false blocks children too).

Only POSITION, DIFFERENCE, ORDINAL spaces get axes. SIZE does not.

### resolveNiceDomains

Nices **all** POSITION domains in the tree, not just axis-bearing nodes. This is required because layer nodes (used as v3 ChartBuilder root) pass through resolveAxes without claiming, so their domain would otherwise be un-niced when gofish.tsx reads it to compute posScales.

### layout() — axis budgeting

```
axisBudgetX = axis_y ? AXIS_THICKNESS : 0   (y-axis takes left x-space)
axisBudgetY = axis_x ? AXIS_THICKNESS : 0   (x-axis takes bottom y-space)
contentSize = [size[0] - axisBudgetX, size[1] - axisBudgetY]
```

**Nested / faceted axes:** Outer axis expands its budget to stack both inner and outer axes. The expansion is direction-specific — `_layoutAlignDir` (set by `Spread`) gates which budget grows:

- `innerBaselineY` (for `_layoutAlignDir === 1`, horizontal spreads): `axisBudgetY += AXIS_THICKNESS` when any child has `axis_x`; reserves a second bottom row for inner x-axis labels.
- `innerBaselineX` (for `_layoutAlignDir === 0`, vertical spreads): `axisBudgetX += AXIS_THICKNESS` when any child has `axis_y`; reserves a second left column for inner y-axis labels.
- **Internal baseline alignment:** After `alignChildren`, each inner frame is shifted back by `-_contentBaseline[alignDir]` so bars land at `posScale(0)` in the outer content space. `_contentBaseline` propagates upward through transparent `layer` nodes.
- **Inner and outer posScales stay consistent:** When `contentPosScales[dim]` is null (outer has ORDINAL space so no posScale is provided), a local POSITION posScale with `TICK_EDGE_PAD` is injected into `contentPosScales` before `_layout` is called, so scatter circles and axis ticks share the same consistent scale.

**posScale rescaling (`TICK_EDGE_PAD`):**

- Applied only once, at the first (outermost) axis-bearing node. Detected by checking `posScale(domain_max) ≈ size[dim]` — a fresh root posScale maps exactly to `size`; a posScale already rescaled by an ancestor maps to less.
- `outerManagesY/X = posScales[dim] !== undefined && tickPad === 0`: when `tickPad === 0` the incoming posScale was already rescaled → pass through unchanged so inner axes stay on the same scale as the outer.

Other:

- Children's transforms are shifted by [axisBudgetX, axisBudgetY] after \_layout
- intrinsicDims is expanded to include axis budget
- Axis child nodes are created and placed: y-axis at [0, axisBudgetY], x-axis at [axisBudgetX, 0]

### INTERNAL_render

Axis children are included in the `allChildrenJSX` array passed to `_render`. The spread's `<g>` wrapper contains both content and axis children at their correct translated positions.

## axis.tsx — Axis Node Types

`AXIS_THICKNESS = 30` — budget allocated per axis
`AXIS_LINE = AXIS_THICKNESS / 2` — where the axis line is drawn (centered in budget)
`TICK_LEN = 4` — ticks extend from line away from content
`LABEL_GAP = 3` — gap between tick end and label anchor

Three constructors via `createAxisNode({ dim, space, contentSize, posScale })`:

- **ContinuousAxisNode** — POSITION space; line + ticks + numeric labels
- **DifferenceAxisNode** — DIFFERENCE space; line + ticks + interval labels between ticks
- **OrdinalAxisNode** — ORDINAL space; labels only, positioned via `posRelToAncestor` from keyContext. First/last labels use `text-anchor="start"/"end"` anchored at the bar edge to prevent edge overflow. `posRelToAncestor` falls back to the nearest same-type ancestor when the exact `stopBefore` node is not in the key node's path (handles faceted charts where `keyContext` is overwritten by later facets).

## scatter.tsx — self-computed posScales

Scatter's `_layout` computes local posScales from `node._underlyingSpace` when passed-in posScales are undefined. The local posScale injection in `GoFishNode.layout()` (described above) now handles this before `_layout` is called, ensuring circles and the axis node share the same padded scale.

## User API

```typescript
// Per-operator override (blocks entire subtree)
spread({ by: "species", dir: "x", axis: false });
spread({ by: "lake", dir: "x", axis: { x: true, y: false } });

// Per-render padding for overflow (labels, annotations)
chart.render(container, { w: 400, h: 300, axes: true, padding: 30 });
```

## Known Limitations / Future Work

- **Polar axes**: no polar axis impl yet
- **Legends**: svg is now tight — no extra hardcoded padding → no room for legends
- **Smarter axis inference**: ordinal should not claim, letting descendants get their own continuous axes for faceted charts.
- **overflow**: labels can clip at SVG edges for wide values. Use `padding` option or add `overflow="visible"` to the SVG.
