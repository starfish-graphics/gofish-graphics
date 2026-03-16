# GoFish Color Scale Design — Session Notes

## Core Decisions

### 1. Unified channel model
All encoding channels (x, y, color) share the same structure, consistent with Vega-Lite. Color is not special-cased.

### 2. Color config lives on `Chart()`
Color scale is defined at the `Chart()` level, not on `Layer()`. Since layers compose Charts, each Chart can have its own independent color scale. `Layer()` doesn't need to know about color scales.

```ts
Chart(seafood, { color: discrete("tableau10") })
  .flow(spread("lake", { dir: "x" }), spread("species", { dir: "x" }))
  .mark(rect({ h: "count", fill: "species" }))
```

### 3. `spread` extended with `dir: "color"`
The `dir` param on `spread` is extended from `"x" | "y"` to `"x" | "y" | "color"`. One param handles all output channels. Two separate spread calls encode different fields into different channels:

```ts
.flow(
  spread("lake", { dir: "x" }),
  spread("species", { dir: "color" })
)
```

### 4. Type inferred from data, not config
Discrete vs continuous behavior is inferred from the data type of the field being encoded — not from an explicit `type` field on the color config.

- Categorical/ordinal field → discrete (cycle through range array, D3-style)
- Continuous/numeric field → continuous (interpolate between range colors)

### 5. `range` and `scheme` coexist
Both are valid ways to define the color space. `scheme` is a named preset; `range` is an explicit array. They are two ways to define the same thing, not additive.

```ts
continuous("viridis")
continuous(["#f7fbff", "#08306b"])
discrete("tableau10")
discrete(["#e41a1c", "#377eb8", "#4daf4a"])
discrete({ Salmon: "#e15759" })  // unmapped values → "#ccc"
```

### 6. `range` array interpretation
- **Discrete field**: array elements are buckets, cycling if more values than colors (D3 ordinal behavior)
- **Continuous field**: 2 colors → interpolate between them; 3+ colors → use as stops to interpolate through in color space

### 7. Diverging scales
Defined by a 3-color range with an optional `mid` domain value that pins the middle color:

```ts
continuous(["blue", "white", "red"])  // mid-point pinning via `mid` option deferred
```

### 8. `group` forces discrete behavior
Grouping a continuous field before spreading into color creates discrete buckets, forcing discrete color behavior. This gives users explicit control over bucketing continuous data.

```ts
.flow(
  group("temperature"),
  spread({ dir: "color" })
)
```

### 9. Small set of named schemes
A curated built-in registry is sufficient for most users:
- **Discrete**: `tableau10`, `tableau20`, ColorBrewer qualitative sets (`Set1`, `Set2`, `Set3`, `Paired`, etc.)
- **Sequential**: `viridis`, `plasma`, `blues`, `greens`, `reds`, etc.
- **Diverging**: `RdBu`, `RdYlGn`, etc.

---

## Deferred / Longer-Term Decisions

### A. Redundant encoding — same field into multiple channels
`spread("lake", { dir: ["x", "color"] })` encoding the same field into both x position and color simultaneously. Useful for accessibility (redundant encoding). `dir` would accept an array of channels.

### B. Multiple color scales per chart (layered)
Currently one color scale per `Chart()` is sufficient. Revisit when layered charts with multiple data layers each encoding different fields with color become a use case. The per-`Chart()` model already handles this correctly if layers are separate Charts.

### C. Hierarchical / nested color schemes
Mapping discrete groups to their own sub-schemes, enabling things like "first bar of each pair shades across blues, second shades across pinks":

```ts
color: {
  domain: {
    salmon: { scheme: "blues" },
    trout: { scheme: "pinks" }
  }
}
```

Top-level maps discrete values to schemes; each scheme handles its own sub-encoding. Two levels is the practical visual limit. The flat color config shape should be designed to accept either a `scheme`/`range` *or* a domain map of `scheme`/`range` objects, so nesting composes cleanly later.

---

## Open Questions (not yet resolved)
- Final name for `dir` param — keep as `dir` (pragmatic) or rename to `into`/`along`/`channel`?
- Fallback color for discrete values not present in an explicit domain map — default color or error?
- Tie-breaking when config shape and data type conflict (e.g. 2-color range but categorical field) — data type wins as tiebreaker?
- Scheme name for inferred type resolution — registry tags each scheme as discrete/sequential/diverging
