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

- posScales and scaleFactors are rescaled proportionally for contentSize
- `TICK_EDGE_PAD = 8` is subtracted from contentSize in posScale computation so the niceMax tick is never flush against the SVG edge
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
- **OrdinalAxisNode** — ORDINAL space; labels only, positioned via `posRelToAncestor` from keyContext

## scatter.tsx — self-computed posScales

Scatter computes its own posScales from `node._underlyingSpace` when passed-in posScales are undefined. Handles faceted contexts where the outer spread has ORDINAL x but inner scatter needs POSITION posScales for dot placement.

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
- **Legends**: svg is now tight- no extra hardcoded padding -> no room for legends
- **Smarter axis inference**: ordinal should not claim, letting descendants get their own continuous axes for faceted charts. Filed as issue.
- **Baseline alignment**: not implemented. Mixing axis/no-axis nodes in the same spread can misalign content baselines.
- **overflow**: labels can clip at SVG edges for wide values. Use `padding` option or add `overflow="visible"` to the SVG.
