# Layout and Render Passes in GoFish Graphics

This document explains the order and mechanics of layout and render passes in the GoFish graphics system, with specific examples and code references.

## Overview

The GoFish rendering pipeline transforms a declarative chart specification into a rendered SVG visualization through a series of well-defined passes. The process can be divided into two main phases:

1. **Layout Phase**: Computes positions, sizes, and spatial relationships
2. **Render Phase**: Generates SVG elements from the laid-out tree

## Entry Point: The `gofish()` Function

The rendering process begins with the `gofish()` function in [`packages/gofish-graphics/src/ast/gofish.tsx`](packages/gofish-graphics/src/ast/gofish.tsx). This function orchestrates the entire pipeline:

```typescript:270:342:packages/gofish-graphics/src/ast/gofish.tsx
const runGofish = async (): Promise<LayoutData> => {
  try {
    scopeContext = new Map();
    scaleContext = { unit: { color: new Map() } };
    keyContext = {};
    initLayerContext();

    const contexts = {
      scaleCtx: scaleContext!,
      scopeCtx: scopeContext!,
      keyCtx: keyContext!,
    };

    const layoutResult = await layout(
      { w, h, x, y, transform, debug, defs, axes },
      child,
      contexts
    );

    return {
      ...layoutResult,
      scaleContext: contexts.scaleCtx,
      keyContext: contexts.keyCtx,
    };
  } finally {
    // Cleanup contexts
    scopeContext = null;
    scaleContext = null;
    keyContext = null;
    resetLayerContext();
  }
};
```

## Layout Phase

The layout phase is handled by the `layout()` function, which performs multiple passes over the chart tree.

### Pass 1: Context Initialization

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:272-275`](packages/gofish-graphics/src/ast/gofish.tsx)

Three global contexts are initialized:

- **`scopeContext`**: Manages variable scoping and data bindings (type: `Map`)
- **`scaleContext`**: Stores computed color scales and scale mappings (type: `{ unit: { color: Map<any, string> } }`)
- **`keyContext`**: Maps string keys to nodes for axis labeling and legends (type: `{ [key: string]: GoFishNode }`)

### Pass 2: Color Scale Resolution

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:172`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
child.resolveColorScale();
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:175-192`](packages/gofish-graphics/src/ast/_node.ts)

This pass traverses the tree and:
- Identifies color encodings (e.g., `fill: "category"` in bar charts)
- Assigns colors from the `color6` palette
- Stores mappings in `scaleContext.unit.color`

**Example**: In a bar chart with `fill: "category"`, each unique category value gets assigned a color from the palette.

### Pass 3: Name Resolution

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:173`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
child.resolveNames();
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:194-201`](packages/gofish-graphics/src/ast/_node.ts)

Maps named nodes to the scope context, enabling references between chart elements.

### Pass 4: Key Resolution

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:174`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
child.resolveKeys();
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:203-210`](packages/gofish-graphics/src/ast/_node.ts)

Assigns unique keys to nodes. These keys are critical for:
- **Axis labeling**: Ordinal axes use keys to position category labels
- **Legend generation**: Keys identify which nodes to include in legends

**Example**: In a bar chart using `spread("category", { dir: "x" })`, each bar gets a key like `"category-value"`, which is later used to position the x-axis labels.

### Pass 5: Size Domain Inference

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:175`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
const sizeDomains = child.inferSizeDomains();
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:225-232`](packages/gofish-graphics/src/ast/_node.ts)

Determines the intrinsic size requirements for each dimension. For `rect` shapes, this is implemented in:

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:171-176`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

```typescript
inferSizeDomains: (shared, children) => {
  return {
    w: computeIntrinsicSize(dims[0].size),
    h: computeIntrinsicSize(dims[1].size),
  };
}
```

The `computeIntrinsicSize()` function returns a `Monotonic` function that maps from data values to pixel sizes. This is used later during layout to determine how much space each element needs.

### Pass 6: Underlying Space Resolution

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:176`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
const [underlyingSpaceX, underlyingSpaceY] = child.resolveUnderlyingSpace();
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:212-223`](packages/gofish-graphics/src/ast/_node.ts)

This is one of the most important passes. It determines the **underlying space** type for each dimension, which affects how scales are computed and how axes are rendered.

**Underlying Space Types** (defined in [`packages/gofish-graphics/src/ast/underlyingSpace.ts`](packages/gofish-graphics/src/ast/underlyingSpace.ts)):

- **`POSITION`**: Continuous position scale (e.g., `x: value(5)`, `y: value(10)`)
- **`DIFFERENCE`**: Difference scale for stacked/grouped charts
- **`SIZE`**: Size-only encoding (no position)
- **`ORDINAL`**: Discrete categorical scale (e.g., `spread("category")`)
- **`UNDEFINED`**: No data-driven encoding

**Example for Bar Chart Rectangles**:

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:92-169`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

For a vertical bar chart where:
- X-axis: `spread("category")` → `ORDINAL` space
- Y-axis: `h: "value"` → `SIZE` space (if no min) or `POSITION` space (if min is specified)

The logic in `resolveUnderlyingSpace` checks:
```typescript
if (!isValue(dims[0].min) && !isValue(dims[0].size)) {
  underlyingSpaceX = ORDINAL([]);
} else if (isAesthetic(dims[0].min) && isValue(dims[0].size)) {
  underlyingSpaceX = DIFFERENCE(getValue(dims[0].size)!);
} else if (!isValue(dims[0].min) && isValue(dims[0].size)) {
  underlyingSpaceX = SIZE(getValue(dims[0].size)!);
} else {
  const min = isValue(dims[0].min) ? getValue(dims[0].min) : 0;
  const size = isValue(dims[0].size) ? getValue(dims[0].size) : 0;
  const domain = interval(min, min + size);
  underlyingSpaceX = POSITION(domain);
}
```

### Pass 7: Position Scale Computation

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:183-202`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
const posScales = [
  underlyingSpaceX.kind === "position"
    ? computePosScale(
        continuous({
          value: [underlyingSpaceX.domain!.min, underlyingSpaceX.domain!.max],
          measure: "unit",
        }),
        w
      )
    : undefined,
  underlyingSpaceY.kind === "position"
    ? computePosScale(
        continuous({
          value: [underlyingSpaceY.domain!.min, underlyingSpaceY.domain!.max],
          measure: "unit",
        }),
        h
      )
    : undefined,
];
```

For `POSITION` spaces, this creates linear scales that map from data values to pixel coordinates. These scales are used during layout to position elements.

### Pass 8: Layout Calculation

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:208`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
child.layout([w, h], [undefined, undefined], posScales);
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:234-252`](packages/gofish-graphics/src/ast/_node.ts)

This is where the actual positioning and sizing happens. Each node's `layout` function is called with:
- Available space: `[w, h]`
- Scale factors: `[undefined, undefined]` (computed internally)
- Position scales: `posScales` (for `POSITION` spaces)

**Example: Rect Layout Function**

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:177-250`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

For a bar chart rectangle, the layout function:

1. **Computes position** (x, y):
   ```typescript
   const x = computeAesthetic(dims[0].min, posScales?.[0]!, undefined);
   const y = computeAesthetic(dims[1].min, posScales?.[1]!, undefined);
   ```

2. **Computes size** (width, height):
   ```typescript
   // If both min and size are data-driven, compute from position scale
   if (isValue(dims[0].min) && isValue(dims[0].size)) {
     const min = x;
     const max = computeAesthetic(
       value(getValue(dims[0].min)! + getValue(dims[0].size)!),
       posScales[0],
       undefined
     );
     w = max - min;
   } else if (isValue(dims[0].size) && posScales?.[0]) {
     // Size-only: compute from position scale with baseline at 0
     const minPos = posScales[0](0);
     const maxPos = posScales[0](getValue(dims[0].size)!);
     w = maxPos - minPos;
   } else {
     // Use size scale factor
     w = computeSize(dims[0].size, scaleFactors?.[0]!, size[0]);
   }
   ```

3. **Returns intrinsic dimensions and transform**:
   ```typescript
   return {
     intrinsicDims: [
       { min: w >= 0 ? 0 : w, size: w, center: w / 2, max: w >= 0 ? w : 0 },
       { min: h >= 0 ? 0 : h, size: h, center: h / 2, max: h >= 0 ? h : 0 },
     ],
     transform: { translate: [x, y] },
   };
   ```

The `intrinsicDims` represent the element's size in its local coordinate system (with min typically at 0), while `transform.translate` positions it in the parent's coordinate system.

### Pass 9: Placement

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:209`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
child.place({ x: x ?? transform?.x ?? 0, y: y ?? transform?.y ?? 0 });
```

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:284-309`](packages/gofish-graphics/src/ast/_node.ts)

Applies final positioning offsets. This is typically used for positioning the entire chart within its container.

### Pass 10: Ordinal Scale Building

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:216-223`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
const ordinalScales: [OrdinalScale | undefined, OrdinalScale | undefined] = [
  isORDINAL(underlyingSpaceX) && keyContext
    ? buildOrdinalScaleX(keyContext, child)
    : undefined,
  isORDINAL(underlyingSpaceY) && keyContext
    ? buildOrdinalScaleY(keyContext, child)
    : undefined,
];
```

**Implementation**: [`packages/gofish-graphics/src/ast/gofish.tsx:65-119`](packages/gofish-graphics/src/ast/gofish.tsx)

For `ORDINAL` spaces, this builds scales that map category keys to pixel positions. The function:
1. Iterates through `keyContext` to find all nodes with keys
2. Computes their final positions (accounting for transforms)
3. Returns a function `(key: string) => number | undefined`

**Example**: In a bar chart with `spread("category", { dir: "x" })`, each bar has a key like `"category-A"`, `"category-B"`, etc. The ordinal scale maps these keys to their x-positions for axis labeling.

## Render Phase

After layout completes, the render phase generates SVG elements.

### Entry Point: The `render()` Function

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:346-842`](packages/gofish-graphics/src/ast/gofish.tsx)

The render function is called from `gofish()` after layout data is available:

```typescript:321:336:packages/gofish-graphics/src/ast/gofish.tsx
return render(
  {
    width: w,
    height: h,
    defs,
    axes,
    scaleContext: data.scaleContext,
    keyContext: data.keyContext,
    sizeDomains: data.sizeDomains,
    underlyingSpaceX: data.underlyingSpaceX,
    underlyingSpaceY: data.underlyingSpaceY,
    posScales: data.posScales,
    ordinalScales: data.ordinalScales,
  },
  data.child
);
```

### Render Pass 1: Context Restoration

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:378-379`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
scaleContext = scaleContextParam;
keyContext = keyContextParam;
```

The global contexts are restored so that render functions can access them.

### Render Pass 2: Axis Tick Calculation

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:381-405`](packages/gofish-graphics/src/ast/gofish.tsx)

If `axes: true`, tick marks are computed for continuous axes using D3's `nice()` and `ticks()` functions.

### Render Pass 3: SVG Container Creation

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:407-417`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
<svg
  width={width + PADDING * 6 + (axes ? 100 : 0)}
  height={height + PADDING * 6 + (axes ? 100 : 0)}
  xmlns="http://www.w3.org/2000/svg"
>
```

The SVG container is created with padding and extra space for axes.

### Render Pass 4: Coordinate Transform

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:416-421`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
<g
  transform={`scale(1, -1) translate(${PADDING * 4}, ${-height - PADDING * 4})`}
>
```

The coordinate system is flipped (Y-axis inverted) to match mathematical conventions, and the chart is positioned with padding.

### Render Pass 5: Node Tree Rendering

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:419-421`](packages/gofish-graphics/src/ast/gofish.tsx)

```typescript
<Show when={transform} keyed fallback={child.INTERNAL_render()}>
  <g transform={transform ?? ""}>{child.INTERNAL_render()}</g>
</Show>
```

The node tree is rendered recursively via `INTERNAL_render()`.

**Implementation**: [`packages/gofish-graphics/src/ast/_node.ts:315-332`](packages/gofish-graphics/src/ast/_node.ts)

```typescript
public INTERNAL_render(
  coordinateTransform?: CoordinateTransform
): JSX.Element {
  return this._render(
    {
      intrinsicDims: this.intrinsicDims,
      transform: this.transform,
      renderData: this.renderData,
      coordinateTransform: coordinateTransform,
    },
    this.children.map((child) =>
      child.INTERNAL_render(
        this.type !== "box" ? coordinateTransform : undefined
      )
    )
  );
}
```

### Render Pass 6: Shape-Specific Rendering

Each shape type has its own render function. For rectangles, this is in:

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:251-449`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

The rect render function handles three cases based on which dimensions are data-driven:

#### Case 1: Both Dimensions Aesthetic (Point-like)

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:298-322`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

When neither dimension is embedded (data-driven), the rect is rendered as a transformed point:

```typescript
if (!isXEmbedded && !isYEmbedded) {
  const center: [number, number] = [
    (displayDims[0].min ?? 0) + (displayDims[0].size ?? 0) / 2,
    (displayDims[1].min ?? 0) + (displayDims[1].size ?? 0) / 2,
  ];
  const [transformedX, transformedY] = space.transform(center);
  // ... render rect at transformed position
}
```

#### Case 2: One Dimension Data-Driven (Line-like)

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:325-399`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

When one dimension is embedded (e.g., bar height in a bar chart), the rect is rendered as a line or path:

```typescript
if (isXEmbedded !== isYEmbedded) {
  const dataAxis = isXEmbedded ? 0 : 1;
  const aestheticAxis = isXEmbedded ? 1 : 0;
  const thickness = displayDims[aestheticAxis].size ?? 0;

  // For linear spaces, render as simple rect
  if (space.type === "linear") {
    // ... render rect with data-driven dimension
  } else {
    // For non-linear spaces, render as path
    const linePath = path([...], { subdivision: 1000 });
    const transformed = transformPath(linePath, space);
    return <path d={pathToSVGPath(transformed)} ... />;
  }
}
```

**Example**: In a vertical bar chart:
- X-axis is aesthetic (spread by `spread()` operator)
- Y-axis is data-driven (`h: "value"`)
- Each bar is rendered as a rectangle with fixed width and data-driven height

#### Case 3: Both Dimensions Data-Driven (Area-like)

**Location**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx:401-449`](packages/gofish-graphics/src/ast/shapes/rect.tsx)

When both dimensions are embedded, the rect is rendered as an area:

```typescript
// If we're in a linear space, render as a rect element
if (space.type === "linear") {
  // ... render rect
} else {
  // For non-linear spaces, render as transformed path
  const corners = path([...], { closed: true, subdivision: 1000 });
  const transformed = transformPath(corners, space);
  return <path d={pathToSVGPath(transformed)} ... />;
}
```

### Render Pass 7: Axis Rendering

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:422-832`](packages/gofish-graphics/src/ast/gofish.tsx)

If `axes: true`, axes are rendered based on the underlying space types:

#### Continuous Y-Axis (POSITION)

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:434-479`](packages/gofish-graphics/src/ast/gofish.tsx)

For `POSITION` spaces, a continuous axis is rendered with tick marks and labels:

```typescript
<Show when={isPOSITION(underlyingSpaceY)}>
  {(() => {
    const [yMin, yMax] = nice(
      underlyingSpaceY.domain!.min,
      underlyingSpaceY.domain!.max,
      10
    );
    const yTicks = ticks(yMin, yMax, 10);
    return (
      <g>
        <line ... /> {/* Axis line */}
        <For each={yTicks}>
          {(tick) => (
            <>
              <text ...>{tick}</text> {/* Tick label */}
              <line ... /> {/* Tick mark */}
            </>
          )}
        </For>
      </g>
    );
  })()}
</Show>
```

#### Ordinal X-Axis

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:683-741`](packages/gofish-graphics/src/ast/gofish.tsx)

For `ORDINAL` spaces, category labels are positioned using the ordinal scale:

```typescript
<Show when={isORDINAL(underlyingSpaceX) && ordinalScales[0] && keyContext}>
  {(() => {
    const scale = ordinalScales[0]!;
    const domain = isORDINAL(underlyingSpaceX) ? underlyingSpaceX.domain : undefined;
    const labelKeys = domain && domain.length > 0 ? domain : [];
    return (
      <g>
        <For each={labelKeys}>
          {(key) => {
            const xPos = scale(key);
            return (
              <text
                transform="scale(1, -1)"
                x={xPos}
                y={-minY + 5}
                text-anchor="middle"
              >
                {key}
              </text>
            );
          }}
        </For>
      </g>
    );
  })()}
</Show>
```

**Example**: In a bar chart with `spread("category", { dir: "x" })`:
1. Each bar has a key like `"category-A"`, `"category-B"`, etc.
2. The `ORDINAL` underlying space has `domain: ["category-A", "category-B", ...]`
3. The ordinal scale maps each key to its x-position
4. Labels are rendered at those positions

### Render Pass 8: Legend Rendering

**Location**: [`packages/gofish-graphics/src/ast/gofish.tsx:801-830`](packages/gofish-graphics/src/ast/gofish.tsx)

Color legends are rendered from the `scaleContext.unit.color` map:

```typescript
<For
  each={Array.from(
    (scaleContext?.unit && "color" in scaleContext.unit
      ? scaleContext.unit.color
      : new Map()
  ).entries()
)}
>
  {([key, value], i) => (
    <g transform={`translate(${width + PADDING * 3}, ${height - i() * 20})`}>
      <rect x={-20} y={-5} width={10} height={10} fill={value} />
      <text ...>{key}</text>
    </g>
  )}
</For>
```

## Complete Example: Bar Chart Rendering

Let's trace through a complete bar chart example:

```typescript
barChart(data, {
  x: "category",
  y: "value",
  orientation: "y"
})
```

### Step 1: Chart Construction

**Location**: [`packages/gofish-graphics/src/charts/bar.ts:88-97`](packages/gofish-graphics/src/charts/bar.ts)

```typescript
const builder = chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }));
```

This creates:
- A `chart` node with the data
- A `spread` operator that groups by "category" and spreads along x
- A `rect` mark with height driven by "value"

### Step 2: Layout Passes

1. **Color Resolution**: No colors specified, so this is a no-op
2. **Key Resolution**: Each bar gets a key like `"category-A"`, `"category-B"`, etc.
3. **Size Domain Inference**: For each rect, `inferSizeDomains` returns a monotonic function for height
4. **Underlying Space Resolution**:
   - X-axis: `ORDINAL` (from `spread`)
   - Y-axis: `SIZE` (height is data-driven, no position)
5. **Layout Calculation**: 
   - X-positions computed by `spread` operator (ordinal spacing)
   - Y-positions set to 0 (bars start at baseline)
   - Heights computed from data values using size scale factors
6. **Ordinal Scale Building**: Maps category keys to x-positions

### Step 3: Render Pass

1. **Rect Rendering**: Each bar is rendered using Case 2 (one dimension data-driven):
   ```typescript
   // X is aesthetic (positioned by spread), Y is data-driven
   const baseX = displayDims[0].min ?? 0;
   const baseY = 0; // Baseline
   const width = displayDims[0].size ?? 0; // Inferred by spread
   const height = displayDims[1].size ?? 0; // From data
   
   return <rect x={baseX} y={-baseY - height} width={width} height={height} ... />;
   ```

2. **Axis Rendering**:
   - X-axis: Ordinal axis with category labels positioned using ordinal scale
   - Y-axis: Continuous axis (if `axes: true`) showing value scale

## Key Takeaways

1. **Layout is separate from rendering**: All spatial calculations happen in the layout phase
2. **Underlying space determines scale types**: The underlying space resolution pass is critical for determining how to scale and render
3. **Keys enable axis labeling**: The key resolution pass enables ordinal axes to find and position category labels
4. **Rendering adapts to coordinate spaces**: The rect render function adapts its rendering strategy based on which dimensions are data-driven and what coordinate transform is active
5. **Contexts flow through passes**: The three global contexts (scope, scale, key) are populated during layout and used during rendering

## Code References Summary

- **Main entry point**: [`packages/gofish-graphics/src/ast/gofish.tsx`](packages/gofish-graphics/src/ast/gofish.tsx)
- **Node implementation**: [`packages/gofish-graphics/src/ast/_node.ts`](packages/gofish-graphics/src/ast/_node.ts)
- **Rect shape**: [`packages/gofish-graphics/src/ast/shapes/rect.tsx`](packages/gofish-graphics/src/ast/shapes/rect.tsx)
- **Bar chart helper**: [`packages/gofish-graphics/src/charts/bar.ts`](packages/gofish-graphics/src/charts/bar.ts)
- **Underlying space types**: [`packages/gofish-graphics/src/ast/underlyingSpace.ts`](packages/gofish-graphics/src/ast/underlyingSpace.ts)
