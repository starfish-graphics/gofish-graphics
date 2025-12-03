# API Design Analysis and Recommendations

## Overview

This document provides analysis and recommendations for the high-level charting API design, building on the motivation and examples already documented.

## Core Design Principles

### 1. **Encoding Clarity Over Positional Symmetry**

The tension between `{x, y}` and `{x, h}` encodings reveals a fundamental question: should the API optimize for positional symmetry or semantic clarity?

**Recommendation**: Use semantic encodings (`h`, `w`, `angle`, etc.) rather than forcing everything through `x`/`y`.

**Rationale**:

- A bar chart's height is semantically different from a y-position
- In `rect({ h: "frequency" })`, the height encoding is clear and unambiguous
- Reusing `y` for both position and height creates confusion when they need to coexist
- The mid-level API already uses this semantic approach successfully

**Example**:

```ts
// Clear: height is an extent, x is a position
chart.bar(alphabet, { x: "letter", h: "frequency" });

// Confusing: is y a position or an extent?
chart.bar(alphabet, { x: "letter", y: "frequency" });
```

### 2. **Direction as Semantic Modifier, Not Type Suffix**

The `dir` parameter approach is superior to type-based naming (`barY`, `barX`).

**Rationale**:

- Maintains consistency with mid-level API's `dir` parameter
- Avoids proliferation of chart type names (bar, barX, barY, barH, barV...)
- Makes directional transformations explicit and composable
- Users learn one concept (`dir`) that applies everywhere

**Trade-off**: Requires one extra parameter, but provides consistency and composability.

### 3. **Compositional Stacking**

The method-chaining approach for stacking is elegant:

```ts
chart
  .bar(data, { x: "state", h: "population", fill: "age", dir: "x" })
  .stack("age", { dir: "y" });
```

**Strengths**:

- Reads naturally as a transformation pipeline
- Stack direction is explicit
- Matches the mental model: "make bars, then stack them"
- Aligns with mid-level API's compositional approach

**Consideration**: Should stacking be a method on the chart object, or a separate operator? Compare:

```ts
// Method chaining (proposed)
chart.bar(...).stack("age", { dir: "y" })

// Operator wrapping (alternative)
stack(chart.bar(...), "age", { dir: "y" })
```

Method chaining reads better and maintains the fluent interface.

## Encoding System Design

### Proposed Encoding Types

Based on the semantic encoding principle, I recommend a consistent encoding vocabulary:

| Encoding                               | Meaning            | Typical Use Cases                    |
| -------------------------------------- | ------------------ | ------------------------------------ |
| **Position encodings**                 |
| `x`, `y`                               | Cartesian position | Categorical spreads, continuous axes |
| `theta`                                | Angular position   | Position around circle/spiral        |
| **Extent encodings**                   |
| `h`, `w`                               | Cartesian extent   | Bar heights/widths                   |
| `r-size`                               | Radial extent      | Rose petals, bubble radius           |
| `theta-size`                           | Angular extent     | Pie slices, arc length               |
| **Bounds encodings**                   |
| `x-start`, `x-end`, `y-start`, `y-end` | Cartesian bounds   | Range bars, waterfall charts         |
| `r-start`, `r-end`                     | Radial bounds      | Donut holes, annular regions         |
| `theta-start`, `theta-end`             | Angular bounds     | Partial pies, gauges                 |
| **Aesthetic encodings**                |
| `fill`, `stroke`                       | Color              | Categorical/continuous color         |
| `opacity`                              | Transparency       | Density, overlap                     |

**Key insight**: Extent encodings (`-size`) are more semantic than direct bounds. Just as `h` is clearer than `y-end - y-start`, `theta-size` is clearer than `theta-end - theta-start`.

### Handling Ambiguous Cases

**Question**: What happens when a user provides both `y` and `h`?

```ts
chart.bar(data, { x: "letter", y: "baseline", h: "frequency" });
```

**Recommendation**: Allow this for flexibility, interpret as "position at y, extend by h".

This enables:

- Baseline-adjusted charts
- Diverging bar charts
- Waterfall charts

### Type Inference vs. Explicit Direction

The original notes mention inferring direction from data types (à la Vega-Lite).

**Recommendation**: Make `dir` optional with smart defaults, but always allow override.

```ts
// Inferred: categorical x → spread horizontally
chart.bar(alphabet, { x: "letter", h: "frequency" });

// Explicit: force vertical spread despite categorical
chart.bar(alphabet, { x: "letter", h: "frequency", dir: "y" });
```

**Default heuristics**:

1. If `x` is categorical and `h` provided → `dir: "x"`
2. If `y` is categorical and `w` provided → `dir: "y"`
3. Otherwise, require explicit `dir`

## Chart Type Taxonomy

### Level of Abstraction

Not all charts need to exist at the high level. Consider three tiers:

**Tier 1 - Essential Charts** (must have high-level API):

- `bar`, `line`, `area`, `scatter`, `pie`
- These cover 80% of use cases

**Tier 2 - Composed Charts** (can be high-level convenience):

- `histogram` (binned bar)
- `heatmap` (grid + color)
- `boxplot` (composed shape)

**Tier 3 - Specialized Charts** (better as templates):

- `sankey`, `treemap`, `dendrogram`
- These have complex domain-specific parameters
- Users ready for these are ready for mid-level API

### Chart Type Orthogonality

Some "chart types" are really variations of the same underlying structure:

```ts
// All of these are fundamentally the same:
chart.bar(data, { x: "category", h: "value" });
chart.column(data, { x: "category", h: "value" }); // rotated bar
chart.row(data, { y: "category", w: "value" }); // horizontal bar
```

**Recommendation**: Don't create separate types for rotational variants. Use `dir` parameter.

## The Pie Chart Problem

Pie charts deserve special attention because they reveal a fundamental tension in charting API design: should we expose the underlying compositional structure or provide convenient abstractions?

### The Grammar of Graphics Perspective

**ggplot2's Position**: ggplot2 famously doesn't provide a `geom_pie()`. Instead, you create pie charts by transforming bar charts:

```r
# ggplot2 approach
ggplot(data, aes(x = "", y = value, fill = category)) +
  geom_bar(stat = "identity", width = 1) +
  coord_polar("y")
```

**Philosophy**: A pie chart is just a bar chart in polar coordinates. By refusing to provide a pie chart primitive, ggplot2 forces users to understand the underlying compositional structure.

**Pros**:

- Teaches the grammar
- Naturally extends to variants (donut, rose, coxcomb)
- No special cases in the API

**Cons**:

- High barrier to entry for common chart
- Most users don't care about the decomposition
- Verbose for a simple need

### The Pragmatic Charting Library Perspective

**ECharts' Position**: ECharts provides `type: 'pie'` with extensive configuration:

```js
{
  type: 'pie',
  data: [
    { value: 1048, name: 'Search Engine' },
    { value: 735, name: 'Direct' },
    { value: 580, name: 'Email' }
  ],
  radius: ['40%', '70%'],  // donut
  roseType: 'area',         // rose chart
  startAngle: 90,
  endAngle: 450             // full circle plus overlap
}
```

**Philosophy**: Users want pie charts, so give them pie charts with all the options they need.

**Pros**:

- Zero learning curve for basics
- Discoverable options for customization
- Covers 99% of pie chart use cases

**Cons**:

- Hides the compositional nature
- Harder to extend to novel variations
- Creates parallel configuration systems (pie config vs bar config)

### GoFish's Unique Position

GoFish has a mid-level API that explicitly represents composition. This creates an opportunity to do better than both approaches.

**At the mid-level**, a pie chart is already expressible:

```ts
// Approach 1: Transform Cartesian bars to polar
chart(alphabet, { coord: polar() })
  .flow(spread("letter", { dir: "x" }))
  .mark(rect({ h: "frequency" }));

// Approach 2: Use polar shapes directly
chart(alphabet)
  .flow(spread("letter", { dir: "theta" }))
  .mark(petal({ "theta-size": "frequency" }));
```

**At the high-level**, we can provide convenience while maintaining compositional clarity:

```ts
Chart(alphabet).pie({ theta: "letter", "theta-size": "frequency" });
```

### Proposed Pie Chart API Design

The key insight is that pie charts are to polar coordinates what bar charts are to Cartesian coordinates. This suggests we should use the same encoding philosophy.

#### The Bar Chart Template

Recall the bar chart uses semantic extent encodings:

```ts
Chart(data).bar({ x: "category", h: "value" }); // height varies
Chart(data).bar({ y: "category", w: "value" }); // width varies
```

- `x`/`y` = position in that dimension
- `h`/`w` = extent/size in that dimension

#### Applying This to Polar Coordinates

For polar shapes, we need polar equivalents:

| Cartesian | Polar                      | Meaning                     |
| --------- | -------------------------- | --------------------------- |
| `x`, `y`  | `theta`                    | Position (angular position) |
| `h`, `w`  | `r-size`, `theta-size`     | Extent in that dimension    |
| -         | `r-start`, `r-end`         | Radial bounds               |
| -         | `theta-start`, `theta-end` | Angular bounds              |

**Standard Pie Chart** (angular extent varies):

```ts
Chart(alphabet).pie({
  theta: "letter", // categorical position around circle
  "theta-size": "frequency", // angular extent varies by data
});
```

**Rose/Coxcomb Chart** (radial extent varies):

```ts
Chart(alphabet).pie({
  theta: "letter", // categorical position around circle
  "r-size": "frequency", // radial extent varies by data
});
```

**Donut Chart** (inner radius > 0):

```ts
Chart(alphabet).pie({
  theta: "letter",
  "theta-size": "frequency",
  "r-start": 0.4, // or innerRadius
  "r-end": 1.0,
});
```

#### The Unified Pie Method Question

Just as `bar()` handles both vertical and horizontal bars without separate methods, should `pie()` handle both standard pies and rose charts?

**Comparison:**

| Bar Chart (Cartesian)                      | Pie Chart (Polar)                                           |
| ------------------------------------------ | ----------------------------------------------------------- |
| `bar({ x: "cat", h: "val" })` - vertical   | `pie({ theta: "cat", "theta-size": "val" })` - standard pie |
| `bar({ y: "cat", w: "val" })` - horizontal | `pie({ theta: "cat", "r-size": "val" })` - rose chart       |
| Same method, different extent encoding     | Same method, different extent encoding                      |

**This suggests `pie()` should be unified**, detecting which dimension varies:

```ts
// Standard pie - theta-size varies
Chart(data).pie({ theta: "category", "theta-size": "value" });

// Rose chart - r-size varies
Chart(data).pie({ theta: "category", "r-size": "value" });

// Donut pie - theta-size varies, with inner radius
Chart(data).pie({
  theta: "category",
  "theta-size": "value",
  "r-start": 0.4,
});

// Donut rose - r-size varies, with inner radius
Chart(data).pie({
  theta: "category",
  "r-size": "value",
  "r-start": 0.4,
});
```

#### Deep Comparison: Unified vs. Separate Methods

**Option 1: Unified `pie()` method (Recommended)**

```ts
// Implementation would detect which size encoding is present
Chart(data).pie({ theta: "cat", "theta-size": "val" }); // → standard pie
Chart(data).pie({ theta: "cat", "r-size": "val" }); // → rose chart
```

**Advantages:**

- Perfect parallel to `bar()` - consistency across the API
- Fewer methods to learn
- Makes the polar/Cartesian analogy explicit
- Users who understand bars immediately understand pies
- Natural extension: both encodings could be present for novel charts

**Disadvantages:**

- Less immediately discoverable (user must know about `r-size` vs `theta-size`)
- Error messages need to be clear when wrong encoding is provided
- Documentation must explain the dimension-based behavior

**Option 2: Separate `pie()` and `rose()` methods**

```ts
Chart(data).pie({ theta: "cat", size: "val" }); // always theta-size
Chart(data).rose({ theta: "cat", size: "val" }); // always r-size
```

**Advantages:**

- More discoverable - users can find "rose chart" by name
- Clearer intent in code
- Simpler documentation for each method

**Disadvantages:**

- Breaks the parallel with `bar()`
- More methods to maintain
- Obscures the underlying similarity
- What about donut roses? `donutRose()`? Combinatorial explosion

#### Recommendation: Unified Method with Intelligent Defaults

Following the bar chart precedent, **use a single `pie()` method** with:

1. **Detection based on encoding present:**

   ```ts
   // Detects theta-size → standard pie
   pie({ theta: "cat", "theta-size": "val" });

   // Detects r-size → rose chart
   pie({ theta: "cat", "r-size": "val" });
   ```

2. **Smart defaults for common cases:**

   ```ts
   // If only "size" is provided, default to theta-size (standard pie)
   pie({ theta: "cat", size: "val" }); // → theta-size implicitly

   // Explicit when needed
   pie({ theta: "cat", "r-size": "val" }); // → rose chart
   ```

3. **Allow both encodings for novel visualizations:**
   ```ts
   // Varies in both dimensions - creates a novel chart type
   pie({ theta: "cat", "theta-size": "val1", "r-size": "val2" });
   ```

This approach:

- Maintains API consistency with `bar()`
- Provides escape hatches for power users
- Keeps the method count low
- Makes the compositional structure visible

### Pie Chart Variants - All From One Method

With the polar encoding system, all common variants emerge naturally from the same `pie()` method:

#### Standard Pie

```ts
Chart(data).pie({
  theta: "category",
  "theta-size": "value",
});
```

#### Donut Pie

Same as standard pie, but with inner radius:

```ts
Chart(data).pie({
  theta: "category",
  "theta-size": "value",
  "r-start": 0.4, // inner radius
  "r-end": 1.0, // outer radius (optional, defaults to 1)
});
```

#### Rose/Coxcomb Chart

Varies radial extent instead of angular:

```ts
Chart(data).pie({
  theta: "category",
  "r-size": "value",
});
```

#### Donut Rose

Rose with inner radius:

```ts
Chart(data).pie({
  theta: "category",
  "r-size": "value",
  "r-start": 0.4,
});
```

#### Partial Pie (Gauge)

Restricts angular range:

```ts
Chart(data).pie({
  theta: "category",
  "theta-size": "value",
  "theta-start": 0, // start at 0 degrees
  "theta-end": Math.PI, // end at 180 degrees (semicircle)
});
```

#### Starburst/Novel Variations

Varies both dimensions:

```ts
Chart(data).pie({
  theta: "category",
  "theta-size": "value1", // angular extent varies
  "r-size": "value2", // radial extent also varies
});
```

### Why This Works: The Encoding Orthogonality Principle

The key insight is that **polar dimensions are orthogonal**, just like Cartesian dimensions:

**Cartesian (Bar):**

- Position: `x` or `y` (categorical spread)
- Extent: `h` or `w` (quantitative encoding)
- Can vary either or both

**Polar (Pie):**

- Position: `theta` (categorical spread around circle)
- Extent: `theta-size` or `r-size` (quantitative encoding)
- Can vary either or both

This creates a 2×2 matrix of possibilities:

|                                   | Fixed radius | Variable radius (`r-size`) |
| --------------------------------- | ------------ | -------------------------- |
| **Fixed angle**                   | Single wedge | Single petal (radial bar)  |
| **Variable angle** (`theta-size`) | Standard pie | Novel: varies both         |

Most chart libraries only expose the two common cases (standard pie, rose). GoFish's compositional approach naturally handles all four.

### Comparison Matrix

| Feature                              | ggplot2                                                              | ECharts                                    | Proposed GoFish                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Basic pie**                        | `geom_bar(width=1) +`<br/>`coord_polar("y")`                         | `type: 'pie'`                              | `pie({ theta: "cat",`<br/>`"theta-size": "val" })`                                               |
| **Donut chart**                      | `geom_bar(width=1) +`<br/>`coord_polar("y") +`<br/>`xlim(c(0.4, 1))` | `radius: [0.4, 1]`                         | `pie({ theta: "cat",`<br/>`"theta-size": "val",`<br/>`"r-start": 0.4 })`                         |
| **Rose chart**                       | `geom_bar() +`<br/>`coord_polar("x")`                                | `roseType: 'area'`                         | `pie({ theta: "cat",`<br/>`"r-size": "val" })`                                                   |
| **Donut rose**                       | `geom_bar() +`<br/>`coord_polar("x") +`<br/>`xlim(c(0.4, 1))`        | `radius: [0.4, 1],`<br/>`roseType: 'area'` | `pie({ theta: "cat",`<br/>`"r-size": "val",`<br/>`"r-start": 0.4 })`                             |
| **Partial pie**                      | Adjust data +<br/>`coord_polar(start=0)`                             | `startAngle: 0,`<br/>`endAngle: 180`       | `pie({ theta: "cat",`<br/>`"theta-size": "val",`<br/>`"theta-start": 0,`<br/>`"theta-end": π })` |
| **Starburst**                        | Very difficult                                                       | Not possible                               | `pie({ theta: "cat",`<br/>`"theta-size": "v1",`<br/>`"r-size": "v2" })`                          |
| **Unified method?**                  | Yes (one geom)                                                       | No (separate types)                        | Yes (one method)                                                                                 |
| **Learning curve**                   | High (must understand<br/>coord transforms)                          | Low (just pick type)                       | Medium (learn<br/>polar encodings)                                                               |
| **Compositional**                    | Yes (forced)                                                         | No (opaque)                                | Yes (optional)                                                                                   |
| **Discoverable**                     | No (must read docs)                                                  | Yes (autocomplete)                         | Yes (type system)                                                                                |
| **Extensible**                       | Yes (any geom)                                                       | No (fixed options)                         | Yes (drop to mid-level)                                                                          |
| **Consistent with<br/>rest of API?** | Yes (all coord_polar)                                                | N/A (no other API)                         | Yes (mirrors bar)                                                                                |

### The Pragmatic Compromise: Best of Both Worlds

**The unified `pie()` method with polar encodings achieves:**

1. **Beginner-friendly** - One method covers all pie chart variants
2. **Compositional** - Encodings are explicit and map to mid-level API
3. **Discoverable** - TypeScript autocomplete shows all encoding options
4. **Extensible** - Novel combinations "just work" without special cases
5. **Consistent** - Perfectly mirrors the `bar()` chart pattern

**At the high-level:**

```ts
// Standard pie
Chart(alphabet).pie({ theta: "letter", "theta-size": "frequency" });

// Rose chart (just change the extent dimension)
Chart(alphabet).pie({ theta: "letter", "r-size": "frequency" });

// Donut (add radial bounds)
Chart(alphabet).pie({
  theta: "letter",
  "theta-size": "frequency",
  "r-start": 0.4,
});
```

**Connection to mid-level** (shown in documentation):

```ts
// High-level pie
Chart(alphabet).pie({ theta: "letter", "theta-size": "frequency" });

// Equivalent at mid-level
chart(alphabet, { coord: polar() })
  .flow(spread("letter", { dir: "theta" }))
  .mark(petal({ "theta-size": "frequency" }));

// Novel variation (drop to mid-level for full control)
chart(alphabet, { coord: polar() })
  .flow(spread("letter", { dir: "theta" }))
  .mark(petal({ "theta-size": "frequency" }))
  .transform(customPolarTransform())
  .layer(otherMarks());
```

**Why this is better than ggplot2 or ECharts:**

- **vs ggplot2**: Less verbose, chart intent is clear, but maintains compositionality
- **vs ECharts**: More flexible (handles novel cases), more consistent (one method), but still convenient
- **vs both**: Smooth gradient from high-level convenience to mid-level power

This approach teaches users the polar encoding concept once, and it applies to:

- All pie variants (standard, rose, donut, partial, etc.)
- Understanding the mid-level API when they're ready
- Creating novel visualizations without API changes

### Implementation Note

The `pie()` method should return the same AST node type as any other chart, making it composable with:

- `.layer()` - overlay multiple charts
- `.facet()` - small multiples of pies
- Mid-level operators - for custom extensions

This maintains the "seamless mixing" principle from the earlier sections.

### Key Design Insights from the Pie Chart Analysis

The deep dive into pie charts revealed several fundamental design principles that should apply to the entire high-level API:

#### 1. Coordinate System Encodings Should Be First-Class

Don't force polar concepts into Cartesian terms. Using `theta`, `r-size`, `theta-size` is better than overloading `x`, `y`, `angle` because:

- It makes the coordinate system explicit
- It creates a consistent pattern across coordinate systems
- It enables clean mapping to mid-level API

**Implication**: Other coordinate systems (bipolar, wavy, etc.) should get their own position/extent encodings if they become common at the high level.

#### 2. Extent Encodings Are More Semantic Than Bounds

Compare these equivalent specifications:

```ts
// Using bounds (verbose, error-prone)
bar({ x: "cat", "y-start": 0, "y-end": "value" });

// Using extent (clear, semantic)
bar({ x: "cat", h: "value" });

// Similarly for polar:
pie({ theta: "cat", "theta-start": 0, "theta-end": "value" }); // bounds
pie({ theta: "cat", "theta-size": "value" }); // extent ✓
```

**Implication**: Default to extent encodings (`h`, `w`, `r-size`, `theta-size`), provide bounds encodings for special cases (waterfall charts, gauges).

#### 3. Method Unification Beats Type Proliferation

The unified `pie()` method handles:

- Standard pies
- Rose charts
- Donuts
- Donut roses
- Partial pies
- Novel hybrids

Alternative approach would require: `pie()`, `donut()`, `rose()`, `donutRose()`, `partialPie()`, `partialRose()`, etc.

**Implication**: Prefer unified methods with orthogonal encodings over separate methods for variants.

#### 4. Encodings Create a Compositional Algebra

The 2×2 matrix of pie chart possibilities:

```
              Fixed radius  |  Variable radius
            ================|==================
Fixed angle     Single wedge | Radial bar
Variable angle  Standard pie | Novel hybrid
```

This isn't a bug, it's a feature! The compositional nature enables:

- Systematic exploration of the design space
- Novel visualizations without API changes
- Clear mental model for users

**Implication**: Design encodings to be orthogonal and composable, not to match a fixed set of chart types.

#### 5. The Bar/Pie Parallel Is Profound

The parallel between bars and pies isn't superficial:

| Concept           | Bar (Cartesian)      | Pie (Polar)               |
| ----------------- | -------------------- | ------------------------- |
| **Position**      | `x` or `y` spread    | `theta` spread            |
| **Extent**        | `h` or `w`           | `theta-size` or `r-size`  |
| **Direction**     | `dir: "x"` or `"y"`  | Implicit in extent choice |
| **Bounds**        | `y-start`, `y-end`   | `r-start`, `r-end`        |
| **Variants**      | Vertical/horizontal  | Standard/rose             |
| **Special cases** | Waterfall, diverging | Donut, gauge              |

**Implication**: This pattern should extend to other chart types. Each chart type is really a mark + coordinate system + default flow.

## Composition and Extension

### Mixing Abstraction Levels

A key design goal is seamless mixing of high, mid, and low levels:

```ts
chart
  .bar(sales, { x: "month", h: "revenue", dir: "x" })
  .mark(line({ y: "target" })) // mid-level mark
  .layer(myCustomViz); // low-level AST
```

**Design requirement**: High-level charts must return AST nodes compatible with mid-level operators.

### The Role of `chart` Object

Two possible patterns:

**Pattern A - Global chart namespace**:

```ts
import { chart } from 'gofish-graphics/charts';
chart.bar(...).stack(...)
```

**Pattern B - Chart constructor**:

```ts
import { Chart } from "gofish-graphics/charts";
const viz = new Chart(data)
  .bar({ x: "letter", h: "frequency" })
  .stack("age", { dir: "y" });
```

**Recommendation**: Pattern B (constructor) for these reasons:

- Data flows naturally through the chain
- Clear scope for transformations
- Easier to type (data types flow through)
- Matches mid-level API's `chart(data)` pattern

```ts
// Proposed syntax
import { Chart } from "gofish-graphics/charts";

Chart(alphabet).bar({ x: "letter", h: "frequency" }).stack("age", { dir: "y" });
```

## Edge Cases and Considerations

### 1. **Faceting and Small Multiples**

How should faceting work?

```ts
Chart(data)
  .bar({ x: "category", h: "value" })
  .facet({ row: "region", col: "year" });
```

This requires special handling - faceting affects the entire chart structure.

### 2. **Scales and Axes**

Should the high-level API expose scale configuration?

```ts
// Explicit scale configuration
Chart(data)
  .bar({ x: "category", h: "value" })
  .scaleY({ domain: [0, 100], nice: true })
  .axisX({ tickFormat: (d) => d.toUpperCase() });
```

**Recommendation**: Yes, but with sensible defaults. Power users need this control.

### 3. **Data Transformations**

Should aggregation happen at the chart level?

```ts
// Option 1: Assume pre-aggregated data
Chart(aggregatedData).bar({ x: "category", h: "sum" });

// Option 2: Perform aggregation
Chart(rawData).bar({
  x: "category",
  h: { field: "value", aggregate: "sum" },
});
```

**Recommendation**: Start with Option 1 (pre-aggregated), add Option 2 if commonly requested.

### 4. **Null and Missing Data**

How should gaps be handled?

```ts
Chart(dataWithGaps)
  .line({ x: "date", y: "temperature" })
  .handleMissing("interpolate"); // or "gap" or "zero"
```

## Implementation Strategy

### Phase 1 - Core Charts

Implement the essential charts that validate the design:

1. `bar` - tests directional flexibility, stacking
2. `line` - tests continuous encoding
3. `scatter` - tests dual continuous encoding
4. `pie` - tests angular encoding

### Phase 2 - Composition

Add compositional features:

1. `.stack()` method
2. `.facet()` method
3. Scale and axis configuration
4. Mixing with mid-level API

### Phase 3 - Expansion

Add convenience charts that are frequently requested:

1. `area`, `histogram`, `heatmap`, `boxplot`

## Open Questions

1. **Naming**: Should it be `Chart` or `chart`? (Recommend `Chart` to distinguish from mid-level)

2. **Return types**: Should chart methods return a special Chart object or raw AST nodes?
   - Chart object: enables more method chaining
   - AST nodes: simpler, more composable with mid-level

3. **Defaults**: How opinionated should defaults be? (axes, colors, spacing)
   - More opinionated: easier for beginners
   - Less opinionated: more flexible

4. **Error handling**: How to handle invalid encoding combinations?
   ```ts
   Chart(data).bar({ h: "value" }); // missing x - error or default?
   ```

## Comparison with Other Libraries

### Observable Plot

**Strengths**: Extremely concise, smart inference
**Weaknesses**: Magic can be confusing, harder to customize

### Vega-Lite

**Strengths**: Comprehensive, type-based inference
**Weaknesses**: Verbose JSON schema, steeper learning curve

### Seaborn

**Strengths**: Beautiful defaults, statistical focus
**Weaknesses**: Limited composition, Python-specific

### Proposed GoFish Charts

**Target strengths**:

- Seamless integration with mid/low-level APIs
- Explicit where it matters (`dir`), smart defaults elsewhere
- Semantic encodings that match the mid-level API
- Composable and extensible

## The Value Proposition Question

Before concluding, we need to address a fundamental question: **What value does the high-level API actually provide?**

### The Thin Wrapper Problem

Consider the bar chart:

```ts
// High-level
Chart(data).bar({ x: "category", h: "value" });

// Mid-level
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }));
```

The high-level version saves what, 20 characters? Is that worth maintaining a parallel API?

### Three Possible Value Propositions

#### Option 1: Thin Wrapper (Questionable Value)

High-level API is just syntactic sugar:

- `bar()` = `spread + rect`
- `pie()` = `spread + petal + polar`
- `line()` = `spread + line mark`

**Problem**: Users who love the mid-level won't bother. New users might as well learn the mid-level.

#### Option 2: Defaults + Discovery (Some Value)

High-level API adds:

- Sensible defaults (axes, colors, scales)
- Better error messages
- Discoverability ("how do I make a bar chart?")

**Example**:

```ts
// High-level - axes, colors, scales all automatic
Chart(data).bar({ x: "category", h: "value", fill: "region" });

// Mid-level - must configure everything
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value", fill: "region" }))
  .scale({ fill: { scheme: "tableau10" } })
  .axis({ x: { title: "Category" }, y: { title: "Value" } });
```

**Better**, but still incremental.

#### Option 3: Complexity Hiding (Real Value)

High-level API hides genuine complexity for charts that require:

- Multiple composed shapes
- Data transformations (binning, aggregation)
- Statistical computations
- Coordinated multi-mark structures

**Examples where this matters:**

**Violin Plot:**

```ts
// High-level - hides kernel density estimation, mirroring, layering
Chart(data).violin({ x: "species", y: "sepal_length" });

// Mid-level - you have to know how to:
// 1. Compute kernel density for each group
// 2. Mirror the density
// 3. Scale to fit
// 4. Layer with box plot
// This is genuinely complex!
```

**Histogram:**

```ts
// High-level - automatic binning
Chart(data).histogram({ x: "value", bins: 20 });

// Mid-level - you must:
// 1. Bin the data yourself
// 2. Compute counts
// 3. Then make bars
const binned = bin(data, "value", 20);
chart(binned)
  .flow(spread("bin", { dir: "x" }))
  .mark(rect({ h: "count" }));
```

**Box Plot:**

```ts
// High-level - statistical computation included
Chart(data).boxplot({ x: "species", y: "value" })

// Mid-level - you must compute quartiles yourself
const stats = computeQuartiles(data, groupBy: "species")
chart(stats)
  .flow(spread("species", { dir: "x" }))
  .mark(boxMark({ q1: "q1", q2: "q2", q3: "q3", whiskers: ... }))
```

### The Tiered Value Proposition

This suggests **different chart types have different value propositions**:

| Tier                            | Chart Types                         | Value Add                                                            | Should It Exist? |
| ------------------------------- | ----------------------------------- | -------------------------------------------------------------------- | ---------------- |
| **Tier 1: Thin wrappers**       | bar, scatter                        | Mostly discovery + defaults                                          | Maybe not?       |
| **Tier 2: Moderate complexity** | line, area, pie                     | Coordinate transforms, stacking                                      | Probably yes     |
| **Tier 3: Real complexity**     | violin, histogram, boxplot, heatmap | Data transformation, statistical computation, multi-mark composition | Definitely yes   |

### Alternative Approach: Coordinate Transforms at High Level

You raised an important point: you could make a pie chart by transforming a bar chart to polar coordinates at the high level!

```ts
// Instead of a separate pie() method:
Chart(data).bar({ x: "category", h: "value" }).coord(polar());

// This is very ggplot2-like and more compositional!
```

**Pros:**

- More compositional
- Fewer chart type methods needed
- Teaches coordinate systems explicitly
- Works with any chart + transform combination

**Cons:**

- Slightly less discoverable than `pie()`
- Requires understanding coordinate transforms
- Polar bars need different defaults than Cartesian bars

### Mixing Abstraction Levels: The Real Power?

You also mentioned mixing levels for customization:

```ts
Chart(data)
  .bar({ x: "category", h: "value" })
  .mark(image({ src: "data:image/png..." })); // Replace rect with image!
```

This is powerful! It means:

- High-level handles the flow (spread, grouping, etc.)
- User drops down one level to customize the mark
- Don't have to rebuild the entire chart from scratch

**This suggests the high-level API's real job is:**

1. Handle the **flow** (spreading, grouping, stacking, binning)
2. Provide **sensible defaults** (axes, scales, colors)
3. Allow **surgical customization** via mid-level operators

Not necessarily to hide the mark itself.

### Revised Recommendation

Based on this analysis:

1. **Don't create high-level methods for every chart type**
   - Skip tier 1 (bar, scatter) or make them very thin
   - Focus on tier 3 (violin, histogram, boxplot)

2. **Consider coordinate transforms as high-level operators**

   ```ts
   .bar(...).coord(polar())  // instead of .pie()
   ```

3. **High-level should focus on:**
   - Data transformations (binning, aggregation, statistics)
   - Complex multi-mark composition
   - Sensible defaults
   - Enabling mid-level customization

4. **For simple charts, mid-level might be the right level**
   - It's already pretty ergonomic
   - Teaching users the mid-level pays off more

This is a more honest value proposition: the high-level API exists for charts where there's **genuine complexity to hide**, not just for syntactic convenience.

## Conclusion

The high-level charting API should prioritize:

1. **Genuine value add** - Only create high-level methods when they hide real complexity (data transforms, statistical computation, multi-mark composition)
2. **Compositional operators** - Coordinate transforms, stacking, faceting as operators rather than chart type variations
3. **Surgical customization** - Easy to drop to mid-level for specific aspects (marks, scales) while keeping high-level flow
4. **Honest about the mid-level** - For simple charts (bar, scatter, line), the mid-level might be the right recommendation
5. **Focus on tier 3** - Violin, histogram, boxplot, heatmap are where high-level really shines

This approach is more defensible: the high-level API isn't trying to replace the mid-level, it's **complementing it for cases where there's real complexity to abstract**.
