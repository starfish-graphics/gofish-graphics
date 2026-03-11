# GoFish Basic Color Scale Implementation

## API Shape

```ts
// Named scheme (string)
Chart(seafood, { color: "tableau10" })

// Array — behavior inferred from field type
Chart(seafood, { color: ["red", "blue", "green"] })

// Explicit keyed map (discrete only)
Chart(seafood, { color: { salmon: "#e41a1c", trout: "#377eb8" } })
```

Combined with spread:
```ts
// Discrete — ordinal field, colors cycle
Chart(seafood, { color: "tableau10" })
  .flow(
    spread("lake", { along: "x" }),
    spread("species", { along: "color" })
  )
  .mark(rect({ h: "count" }))

// Continuous — numeric field, colors interpolate
Chart(seafood, { color: ["blue", "white", "red"] })
  .flow(
    spread("lake", { along: "x" }),
    spread("temperature", { along: "color" })
  )
  .mark(rect({ h: "count" }))
```

---

## How It Works

### 1. Extend `along` to accept `"color"`
`along: "x" | "y" | "color"` — no other changes to spread's interface.

### 2. Color config on Chart options
Add `color` as an optional field on the Chart options object:
```ts
type ColorConfig = string | string[] | Record<string, string>
```

### 3. Resolving the scale at render time
When a `spread` with `along: "color"` is evaluated, it:
1. Reads the field's inferred data type from the existing type system
2. Reads the `color` config from the Chart options
3. Picks a scale strategy based on field type:

| Field type | Color config | Behavior |
|---|---|---|
| Ordinal/categorical | `string` (named) | Look up named discrete palette, cycle |
| Ordinal/categorical | `string[]` | Use array as palette, cycle |
| Ordinal/categorical | `Record<string, string>` | Direct value → color lookup |
| Continuous/numeric | `string` (named) | Look up named continuous scheme, interpolate |
| Continuous/numeric | `string[]` | Use array as interpolation stops |

### 4. Discrete: cycling
Given a palette array and a set of domain values, assign colors by index modulo palette length — same as D3 ordinal. If an explicit keyed map is provided, look up directly, with a fallback color for unmapped values (e.g. `"#ccc"`).

### 5. Continuous: interpolation
Given an array of color stops, interpolate in RGB or HSL space. 2 stops → linear interpolation. 3+ stops → piecewise linear, stops evenly distributed across the domain unless `mid` is specified (deferred for now).

### 6. Named scheme registry
A simple lookup table mapping scheme names to their color arrays and type tag:
```ts
const schemes = {
  tableau10: { type: "discrete", colors: ["#4e79a7", "#f28e2b", ...] },
  viridis:   { type: "continuous", colors: ["#440154", "#31688e", "#35b779", "#fde725"] },
  blues:     { type: "continuous", colors: ["#f7fbff", "#08306b"] },
}
```
Type tag is used as a sanity check against the inferred field type. Mismatch can warn but shouldn't hard error for now.

---

## What's Not Included Yet
- Diverging scales with `mid` domain pinning
- Redundant encoding (`along: ["x", "color"]`)
- Nested/hierarchical schemes
- Multiple color scales per layered chart

---

## Implementation

### Files changed

**`src/ast/colorSchemes.ts`** (new)
- `ColorConfig` type: `string | string[] | Record<string, string>`
- Named scheme registry (`tableau10`, `viridis`, `blues`, `reds`) with `type: "discrete" | "continuous"` tags
- `assignDiscreteColor(config, key, index)` — cycles through palette by index
- `assignContinuousColor(config, t)` — interpolates via chroma-js at position `t` in [0, 1]

**`src/ast/gofish.tsx`**
- `ScaleContext` unit type extended: `{ color: Map<any, string>; colorConfig?: ColorConfig }`
- `gofish()` options: added `colorConfig?: ColorConfig`
- `scaleContext` init: passes `colorConfig` into `unit` so all nodes in the tree can read it

**`src/ast/_node.ts`**
- `render()` options: added `colorConfig?: ColorConfig`, passed through to `gofish()`
- Added `collectColorValues(out)` — walks the subtree collecting unique color values in encounter order
- `resolveColorScale()` is now two-pass when `colorConfig` is set:
  1. `collectColorValues()` gathers all unique values from the entire subtree
  2. If all values are numbers → compute min/max, interpolate each at `t = (v - min) / (max - min)`
  3. If values are strings → cycle by index
  - Falls back to original `color6` single-pass when no `colorConfig`

**`src/ast/marks/chart.ts`**
- `ChartOptions`: added `color?: ColorConfig`
- `SpreadOptions`: `dir` type extended to `"x" | "y" | "x, color" | "y, color"`; spatial direction parsed as `dir.startsWith("x") ? "x" : "y"`
- `ChartBuilder.render()`: injects `colorConfig: this.options?.color` into the node render call

### Color assignment rules
| Data type | Behavior |
|---|---|
| String / ordinal | Discrete: cycle through palette by insertion order |
| Number / continuous | Continuous: interpolate across palette by value position in domain |
| `Record<string, string>` config | Direct key → color lookup, `"#ccc"` fallback |

### What didn't change
- `dir: "x"` / `dir: "y"` still work (backwards compatible)
- Fill must still be declared on the mark (`fill: "species"`)
- `"x, color"` vs `"x"` has no spatial difference — color encoding is handled purely by `resolveColorScale()`
