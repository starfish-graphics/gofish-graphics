# GoFish Basic Color Scale Implementation

## API Shape

```ts
// Discrete — named scheme, colors cycle
Chart(seafood, { color: discrete("tableau10") })

// Discrete — explicit palette array, colors cycle
Chart(seafood, { color: discrete(["#e41a1c", "#377eb8", "#4daf4a"]) })

// Discrete — explicit key→color map, unmapped values fall back to "#ccc"
Chart(seafood, { color: discrete({ Salmon: "#e15759" }) })

// Continuous — named scheme, interpolates
Chart(scores, { color: continuous("blues") })

// Continuous — explicit color stops, interpolates
Chart(scores, { color: continuous(["#f7fbff", "#42c663", "#6b0808"]) })
```

---

## How It Works

### 1. `ColorConfig` type

```ts
type DiscreteScale  = { _tag: "discrete";  values: string | string[] | Record<string, string> }
type ContinuousScale = { _tag: "continuous"; stops:  string | string[] }
type ColorConfig = DiscreteScale | ContinuousScale

const discrete   = (values: string | string[] | Record<string, string>): DiscreteScale
const continuous = (stops:  string | string[]): ContinuousScale
```

The `_tag` is the explicit user intent. Scale behavior is determined solely by `_tag` — no data-type inference.

### 2. Discrete: cycling / lookup
- `string` → look up named scheme, cycle by index
- `string[]` → cycle by index
- `Record<string, string>` → direct key lookup; unmapped values fall back to `"#ccc"` automatically

### 3. Continuous: interpolation
- `string` → look up named scheme stops, interpolate via chroma-js in lab space
- `string[]` → use as stops, interpolate via chroma-js in lab space
- Position `t` computed as `(value - min) / (max - min)` across the subtree domain

### 4. Named scheme registry (`colorSchemes.ts`)
```ts
const schemes = {
  tableau10: { type: "discrete",   colors: ["#4e79a7", "#f28e2b", ...] },
  viridis:   { type: "continuous", colors: ["#440154", "#31688e", "#35b779", "#fde725"] },
  blues:     { type: "continuous", colors: ["#f7fbff", "#deebf7", "#9ecae1", "#3182bd", "#08306b"] },
  reds:      { type: "continuous", colors: ["#fff5f0", "#fc9272", "#de2d26", "#67000d"] },
}
```

### 5. Two-pass color resolution (`_node.ts` `resolveColorScale()`)
1. `collectColorValues()` walks the subtree collecting unique fill values in encounter order
2. Dispatch on `colorConfig._tag`:
   - `"continuous"` → compute min/max, assign each value `assignContinuousColor(config, t)`
   - `"discrete"` → assign each value `assignDiscreteColor(config, key, index)`
3. Falls back to `color6` cycling when no `colorConfig` is set

---

## Files Changed

**`src/ast/colorSchemes.ts`**
- `DiscreteScale`, `ContinuousScale`, `ColorConfig` types
- `discrete()`, `continuous()` constructors
- `assignDiscreteColor(config: DiscreteScale, key, index)`
- `assignContinuousColor(config: ContinuousScale, t)`

**`src/ast/_node.ts`**
- `resolveColorScale()`: dispatches on `_tag` instead of inferring from data type

**`src/ast/marks/chart.ts`**
- `ChartOptions.color?: ColorConfig`
- `SpreadOptions.dir`: `"x" | "y"` (combined `"x, color"` form was removed — redundant)
- `ChartBuilder.render()`: passes `colorConfig` through to node render

**`src/lib.ts`**
- Exports `discrete`, `continuous`, `ColorConfig`, `DiscreteScale`, `ContinuousScale`

---

## What's Not Included Yet
- Diverging scales with `mid` domain pinning
- `schemeColors(name: string): string[]` — expose raw colors from a named scheme so users can subset or extend palettes (e.g. `discrete(schemeColors("tableau10").slice(0, 5))`)
- Redundant encoding (`dir: ["x", "color"]`)
- Nested/hierarchical schemes
- Multiple color scales per layered chart
