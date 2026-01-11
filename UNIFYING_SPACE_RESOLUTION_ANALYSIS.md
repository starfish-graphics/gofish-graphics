# Unifying Space Resolution: Analysis and Implementation Plan

**Date**: 2026-01-08
**Goal**: Replace `inferPosDomains` and `inferSizeDomains` with a unified `resolveUnderlyingSpace` pass

## Executive Summary

This document analyzes the work required to completely replace the two separate domain inference passes (`inferPosDomains` and `inferSizeDomains`) with a single unified `resolveUnderlyingSpace` pass in the GoFish Graphics rendering pipeline. The analysis reveals that while the conceptual unification is elegant, the implementation requires significant enrichment of the `UnderlyingSpace` representation to capture all information currently provided by both passes.

### Current Status
- ✅ Basic `resolveUnderlyingSpace` infrastructure exists
- ✅ POSITION spaces can compute domains
- ✅ INTERVAL spaces track widths
- ✅ ORDINAL spaces indicate discrete layout
- ❌ Size constraint solving not yet unified
- ❌ Layout pass still depends on separate `inferSizeDomains`
- ❌ Ordinal spacing and grouping not fully integrated

---

## 1. Current Architecture Deep Dive

### 1.1 The Three-Pass System

GoFish currently uses a **three-pass rendering pipeline** executed in [gofish.tsx:100-142](gofish.tsx#L100-L142):

```typescript
// Pass 1: Infer position domains (OLD)
const [posDomainX, posDomainY] = child.inferPosDomains();

// Pass 2: Infer size domains (OLD)
const sizeDomains = child.inferSizeDomains();

// Pass 3: Resolve underlying space (NEW)
const [underlyingSpaceX, underlyingSpaceY] = child.resolveUnderlyingSpace();

// Then: Layout and placement
child.layout([w, h], [undefined, undefined], posScales);
child.place({ x, y });
```

Each pass serves a distinct purpose that must be unified.

### 1.2 What `inferPosDomains` Does

**Purpose**: Computes continuous data domains for position encodings

**Type Signature**:
```typescript
inferPosDomains: (
  childPosDomains: Size<ContinuousDomain>[]
) => FancySize<ContinuousDomain | undefined>
```

**Data Structure** ([domain.ts:5-9](domain.ts#L5-L9)):
```typescript
type ContinuousDomain = {
  type: "continuous";
  value: [number, number];  // [min, max] in data space
  measure: Measure;         // Unit of measurement (e.g., "unit", "px")
}
```

**Key Behaviors**:

1. **Leaf Shapes** (e.g., [rect.tsx:154-179](rect.tsx#L154-L179)):
   - If `min` is a data value: returns `[min, min+size]` domain
   - Otherwise: returns `undefined`
   - Example: `rect({ x: value(5), w: value(10) })` → domain `[5, 15]`

2. **Layer Operator** ([layer.tsx:123-155](layer.tsx#L123-L155)):
   - **Unifies** all child domains per axis using `unifyContinuousDomains`
   - Takes union of all continuous ranges
   - Example: Children with domains `[0, 10]` and `[5, 20]` → unified `[0, 20]`

3. **Stack Operator** ([stack.tsx:161-211](stack.tsx#L161-L211)):
   - **Stack direction**: Unifies child domains (like layer)
   - **Align direction**: Preserves child domains based on alignment
   - Special logic for `start`/`end`/`middle` alignment

**Usage**:
- Creates position scales in [gofish.tsx:112-135](gofish.tsx#L112-L135)
- Scales transform data coordinates → device coordinates
- Example: domain `[0, 100]` with canvas width 500 → scale function `x => x * 5`

### 1.3 What `inferSizeDomains` Does

**Purpose**: Computes monotonic functions mapping scale factors to required sizes

**Type Signature**:
```typescript
inferSizeDomains: (
  shared: Size<boolean>,
  children: GoFishNode[]
) => FancySize<ScaleFactorFunction>
```

**Data Structure** ([monotonic.ts:3-15](monotonic.ts#L3-L15)):
```typescript
type ScaleFactorFunction = Monotonic.Monotonic = {
  kind: "linear" | "unknown";
  run: (scaleFactor: number) => number;     // Forward: SF → size
  inverse: (size: number) => number;         // Inverse: size → SF
}

// Most common: Linear functions
type Linear = {
  kind: "linear";
  slope: number;      // Data-driven size component
  intercept: number;  // Fixed aesthetic size component
}
```

**Key Behaviors**:

1. **Leaf Shapes** ([rect.tsx:181-186](rect.tsx#L181-L186)):
   ```typescript
   // Helper function (rect.tsx:37-43)
   const computeIntrinsicSize = (input: MaybeValue<number>) => {
     return isValue(input)
       ? Monotonic.linear(getValue(input), 0)     // Data: slope only
       : Monotonic.linear(0, input ?? 0);         // Aesthetic: intercept only
   }
   ```
   - Data-driven size: `f(sf) = size * sf` (e.g., `linear(10, 0)`)
   - Aesthetic size: `f(sf) = constant` (e.g., `linear(0, 50)`)
   - **Interpretation**: "At scale factor 1.0, this rect needs 10 data units + 50 aesthetic pixels"

2. **Stack Operator** ([stack.tsx:213-246](stack.tsx#L213-L246)):
   - **Stack direction**:
     - Edge-to-edge mode: `sum(children) + spacing * (n-1)`
     - Center-to-center mode: `child[0]/2 + spacing*(n-1) + child[last]/2`
   - **Align direction**: `max(children)`
   - Uses monotonic algebra: `Monotonic.add(...)`, `Monotonic.adds(fn, scalar)`

3. **Layer Operator** ([layer.tsx:156-173](layer.tsx#L156-L173)):
   - Both directions: `max(children)`
   - All children share the same canvas size

**Usage in Layout** ([rect.tsx:187-224](rect.tsx#L187-L224)):
```typescript
layout: (shared, size, scaleFactors, ...) => {
  // If min and size are both data values, use position scale
  if (isValue(dims[0].min) && isValue(dims[0].size)) {
    const min = posScales[0](getValue(dims[0].min));
    const max = posScales[0](getValue(dims[0].min) + getValue(dims[0].size));
    w = max - min;
  } else {
    // Otherwise use scale factor from size domain constraint solving
    w = computeSize(dims[0].size, scaleFactors[0], size[0]);
  }
}
```

**Critical Insight**: Scale factors are solved by **inverting** the size domain functions:
- Given: Canvas size `W` and size domain function `f(sf) = required_width`
- Solve: `sf = f^(-1)(W)`
- Example: If `f(sf) = 20*sf + 100` and `W = 300`, then `sf = (300-100)/20 = 10`
- This scale factor is then used to compute actual sizes during layout

### 1.4 What `resolveUnderlyingSpace` Does

**Purpose**: Classifies the **kind** of data space each axis represents

**Type Signature**:
```typescript
resolveUnderlyingSpace: (
  children: Size<UnderlyingSpace>[]
) => FancySize<UnderlyingSpace>
```

**Data Structure** ([underlyingSpace.ts:4-44](underlyingSpace.ts#L4-L44)):
```typescript
type UnderlyingSpace =
  | POSITION_TYPE    // Absolute positions matter
  | INTERVAL_TYPE    // Relative distances matter
  | ORDINAL_TYPE     // Categorical ordering matters
  | UNDEFINED_TYPE   // No data-driven space

type POSITION_TYPE = {
  kind: "position";
  domain: Interval;              // Currently computed!
  spacing?: number;              // For ordinal groups
  ordinalGroupId?: string;       // Group identifier
  source?: string;               // Debug provenance
}

type INTERVAL_TYPE = {
  kind: "interval";
  width: number;                 // Total width of interval
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type ORDINAL_TYPE = {
  kind: "ordinal";
  spacing?: number;              // Spacing between ordinal elements
  ordinalGroupId?: string;
  source?: string;
}

type UNDEFINED_TYPE = {
  kind: "undefined";
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}
```

**Key Behaviors** ([rect.tsx:84-152](rect.tsx#L84-L152)):

```typescript
// Rect's space resolution logic
resolveUnderlyingSpace: () => {
  // Decision table based on min/size being aesthetic (a), value (v), or undefined (u):
  //
  // min size → space type
  // --------
  // a   a  → ORDINAL
  // a   v  → INTERVAL(width)
  // a   u  → ORDINAL
  // v   a  → POSITION([min, min])
  // v   v  → POSITION([min, min+size])
  // v   u  → POSITION([min, min])
  // u   a  → ORDINAL
  // u   v  → POSITION([0, size])
  // u   u  → ORDINAL

  if (!isValue(dims[0].min) && !isValue(dims[0].size)) {
    return ORDINAL;
  } else if (isAesthetic(dims[0].min) && isValue(dims[0].size)) {
    return INTERVAL(getValue(dims[0].size));
  } else {
    const min = isValue(dims[0].min) ? getValue(dims[0].min) : 0;
    const size = isValue(dims[0].size) ? getValue(dims[0].size) : 0;
    return POSITION([min, min + size]);
  }
}
```

**Stack Operator Logic** ([stack.tsx:92-159](stack.tsx#L92-L159)):

```typescript
// ALIGNMENT RULES (perpendicular to stack direction)
if (children all POSITION && alignment is "start" or "end") {
  alignSpace = POSITION(union of child domains)
} else if (children all POSITION && alignment is "middle") {
  alignSpace = INTERVAL(width of union)
} else {
  alignSpace = UNDEFINED
}

// SPACING RULES (parallel to stack direction)
if (children all POSITION && spacing === 0) {
  stackSpace = POSITION([0, sum of child widths])
} else if (children all POSITION && spacing > 0) {
  stackSpace = ORDINAL  // Discrete positioning needed
} else {
  stackSpace = ORDINAL
}
```

**Usage** ([gofish.tsx:112-135](gofish.tsx#L112-L135)):
```typescript
// If underlying space is POSITION, use its domain for scaling
const posScales = [
  underlyingSpaceX.kind === "position"
    ? computePosScale({
        value: [underlyingSpaceX.domain.min, underlyingSpaceX.domain.max],
        measure: "unit"
      }, w)
    : posDomainX  // Fallback to old system
      ? computePosScale(posDomainX, w)
      : undefined,
  // ... same for Y
];
```

**Current Limitation**: Only POSITION spaces compute actual domains. ORDINAL and INTERVAL spaces don't yet carry enough information to replace size domain inference.

---

## 2. The Gap: What's Missing

To fully replace both `inferPosDomains` and `inferSizeDomains`, `UnderlyingSpace` must capture **all** information needed for:

1. ✅ **Position scale creation** (DONE for POSITION spaces)
2. ❌ **Size constraint solving** (NOT YET)
3. ❌ **Ordinal layout calculations** (PARTIAL)
4. ❌ **Interval-based sizing** (PARTIAL)

### 2.1 Missing Information for Size Constraint Solving

**Problem**: The layout pass needs to know "how much space does this subtree need as a function of scale factor?"

**Current `inferSizeDomains` provides**:
- Monotonic functions: `f(scaleFactor) → required_size`
- Composition algebra: sum, max, scalar multiply
- Inversion capability: given target size, find scale factor

**Current `resolveUnderlyingSpace` provides**:
- For POSITION: Just the domain, not size requirements
- For INTERVAL: A fixed width, but no scale factor dependency
- For ORDINAL: Nothing about size

**Example Scenario**:
```typescript
stack([
  rect({ x: value(0), w: value(10) }),      // Data-driven width: needs sf * 10
  rect({ x: aesthetic('left'), w: 50 }),     // Aesthetic width: needs 50 pixels
], { spacing: 5 })

// Current inferSizeDomains returns:
// Monotonic.linear(10, 55)  // f(sf) = 10*sf + 55
// Meaning: "At sf=1, need 65 pixels; at sf=2, need 75 pixels"

// Current resolveUnderlyingSpace returns:
// POSITION([0, 10])  // Just the data domain, no size info!
```

**What's needed**: Each space type must carry size requirement information.

### 2.2 Missing Information for Ordinal Layout

**Problem**: When `spacing > 0`, elements need discrete positioning with gaps.

**Current `inferSizeDomains` provides**:
- For stack with spacing: `sum(children) + spacing * (n-1)`
- For layer: `max(children)`

**Current `resolveUnderlyingSpace` provides**:
- `ORDINAL` flag indicating discrete layout needed
- Optional `spacing` value
- Optional `ordinalGroupId` for grouping

**What's missing**:
- How many discrete elements? (Count of ordinal buckets)
- What are the sizes of each bucket?
- How do they compose during stack/layer operations?

**Example Scenario**:
```typescript
// Grouped bar chart
stack([
  rect({ x: aesthetic('A'), w: value(10) }),
  rect({ x: aesthetic('B'), w: value(15) }),
  rect({ x: aesthetic('C'), w: value(8) }),
], { spacing: 5 })

// Need to know:
// - 3 ordinal buckets: A, B, C
// - Sizes: 10*sf, 15*sf, 8*sf
// - Total: max(10,15,8)*sf + 2*5 = 15*sf + 10
```

### 2.3 Missing Information for Interval Sizing

**Problem**: Streamgraphs and middle-aligned stacks need interval widths that scale.

**Current `INTERVAL_TYPE`**:
```typescript
type INTERVAL_TYPE = {
  kind: "interval";
  width: number;  // Fixed width - doesn't scale!
  ...
}
```

**What's needed**: Width as a function of scale factor
```typescript
type INTERVAL_TYPE = {
  kind: "interval";
  width: ScaleFactorFunction;  // f(sf) → width
  ...
}
```

### 2.4 Overlap with Current System

**Critical Observation**: Notice in [rect.tsx:84-152](rect.tsx#L84-L152) that `resolveUnderlyingSpace` **already computes the position domain** for POSITION spaces:

```typescript
const min = isValue(dims[0].min) ? getValue(dims[0].min) : 0;
const size = isValue(dims[0].size) ? getValue(dims[0].size) : 0;
underlyingSpaceX = POSITION([min, min + size]);
```

This is **exactly the same computation** as `inferPosDomains`:

```typescript
inferPosDomains: () => {
  return isValue(dims[0].min)
    ? continuous({
        value: [
          getValue(dims[0].min),
          isValue(dims[0].size)
            ? getValue(dims[0].min) + getValue(dims[0].size)
            : getValue(dims[0].min),
        ],
        measure: getMeasure(dims[0].min),
      })
    : undefined;
}
```

**Implication**: For POSITION spaces, we're computing the domain twice! Once in `resolveUnderlyingSpace` (stored in `domain: Interval`) and once in `inferPosDomains` (returned as `ContinuousDomain`).

The code in [gofish.tsx:112-135](gofish.tsx#L112-L135) shows the transition happening:
```typescript
const posScales = [
  underlyingSpaceX.kind === "position"
    ? computePosScale(/* use underlyingSpace.domain */, w)
    : posDomainX  // Fallback to OLD system
      ? computePosScale(posDomainX, w)
      : undefined,
];
```

Once all nodes implement `resolveUnderlyingSpace` correctly, the `posDomainX` fallback can be removed.

---

## 3. Proposed Enrichment of `UnderlyingSpace`

### 3.1 Add Size Functions to All Space Types

**Core Idea**: Every space type should carry a `ScaleFactorFunction` representing its size requirements.

```typescript
type POSITION_TYPE = {
  kind: "position";
  domain: Interval;                    // [min, max] in data coordinates
  sizeFunction: ScaleFactorFunction;   // NEW: f(sf) → device size
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type INTERVAL_TYPE = {
  kind: "interval";
  width: number;                       // DEPRECATED: use widthFunction instead
  widthFunction: ScaleFactorFunction;  // NEW: f(sf) → interval width
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type ORDINAL_TYPE = {
  kind: "ordinal";
  count?: number;                      // NEW: number of discrete buckets
  bucketSizes?: ScaleFactorFunction[]; // NEW: size of each bucket
  sizeFunction: ScaleFactorFunction;   // NEW: total size including spacing
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type UNDEFINED_TYPE = {
  kind: "undefined";
  sizeFunction: ScaleFactorFunction;   // NEW: typically constant zero or aesthetic
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}
```

### 3.2 Semantic Meaning of Size Functions

**POSITION spaces**:
- `domain`: The data coordinate range (e.g., `[0, 100]` in data units)
- `sizeFunction`: How much device space is needed
  - If both min and size are data-driven: `linear(size_in_data_units, 0)`
  - If size is aesthetic: `linear(0, aesthetic_size)`
  - **Example**: `rect({ x: value(0), w: value(10) })` → `sizeFunction = linear(10, 0)`
  - **Example**: `rect({ x: value(0), w: 50 })` → `sizeFunction = linear(0, 50)`

**INTERVAL spaces**:
- `widthFunction`: The width of the interval as a function of scale
  - **Example**: `rect({ x: aesthetic('left'), w: value(10) })` → `widthFunction = linear(10, 0)`
  - Used when alignment is "middle" in stack

**ORDINAL spaces**:
- `count`: Number of discrete categories/buckets
- `bucketSizes`: Size function for each bucket (optional, for heterogeneous buckets)
- `sizeFunction`: Total size needed including spacing
  - **Formula for stack**: `max(bucketSizes) + spacing * (count - 1)`
  - **Example**: 3 bars with widths `[10*sf, 15*sf, 8*sf]` and spacing 5:
    - `count = 3`
    - `sizeFunction = linear(15, 10)` // max(10,15,8)*sf + 5*(3-1)

**UNDEFINED spaces**:
- `sizeFunction`: Typically `linear(0, 0)` (zero size) or aesthetic constant
- Used when neither min nor size is data-driven but may have aesthetic size

### 3.3 Construction Helpers

To maintain ergonomics and avoid breaking changes, create smart constructors:

```typescript
// underlyingSpace.ts

export const POSITION = (
  domain: [number, number],
  opts?: {
    sizeFunction?: ScaleFactorFunction;
    spacing?: number;
    ordinalGroupId?: string;
    source?: string;
  }
): POSITION_TYPE => {
  const domainInterval = interval(domain[0], domain[1]);
  return {
    kind: "position",
    domain: domainInterval,
    sizeFunction: opts?.sizeFunction ??
                  Monotonic.linear(Interval.width(domainInterval), 0),
    spacing: opts?.spacing,
    ordinalGroupId: opts?.ordinalGroupId,
    source: opts?.source,
  };
};

export const INTERVAL = (
  width: number | ScaleFactorFunction,
  opts?: {
    spacing?: number;
    ordinalGroupId?: string;
    source?: string;
  }
): INTERVAL_TYPE => {
  const widthFunction = typeof width === 'number'
    ? Monotonic.linear(width, 0)
    : width;
  return {
    kind: "interval",
    width: typeof width === 'number' ? width : 0,  // Deprecated fallback
    widthFunction,
    spacing: opts?.spacing,
    ordinalGroupId: opts?.ordinalGroupId,
    source: opts?.source,
  };
};

export const ORDINAL = (opts?: {
  count?: number;
  bucketSizes?: ScaleFactorFunction[];
  sizeFunction?: ScaleFactorFunction;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}): ORDINAL_TYPE => {
  return {
    kind: "ordinal",
    count: opts?.count,
    bucketSizes: opts?.bucketSizes,
    sizeFunction: opts?.sizeFunction ?? Monotonic.linear(0, 0),
    spacing: opts?.spacing ?? 0,
    ordinalGroupId: opts?.ordinalGroupId,
    source: opts?.source,
  };
};

export const UNDEFINED = (opts?: {
  sizeFunction?: ScaleFactorFunction;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}): UNDEFINED_TYPE => {
  return {
    kind: "undefined",
    sizeFunction: opts?.sizeFunction ?? Monotonic.linear(0, 0),
    spacing: opts?.spacing,
    ordinalGroupId: opts?.ordinalGroupId,
    source: opts?.source,
  };
};
```

### 3.4 Space Algebra Operations

Need helper functions to combine spaces (analogous to monotonic algebra):

```typescript
// underlyingSpace.ts

/**
 * Take the maximum of multiple underlying spaces.
 * Used by layer operator.
 */
export function maxSpaces(...spaces: UnderlyingSpace[]): UnderlyingSpace {
  // If all are POSITION, union domains and max sizes
  if (spaces.every(isPOSITION)) {
    const unionDomain = Interval.unionAll(...spaces.map(s => s.domain));
    const maxSize = Monotonic.max(...spaces.map(s => s.sizeFunction));
    return POSITION(
      [unionDomain.min, unionDomain.max],
      { sizeFunction: maxSize }
    );
  }

  // If any are ORDINAL, result is ORDINAL
  if (spaces.some(isORDINAL)) {
    // Combine ordinal counts, take max sizes
    const ordinalSpaces = spaces.filter(isORDINAL);
    const totalCount = ordinalSpaces.reduce((sum, s) => sum + (s.count ?? 1), 0);
    const maxSize = Monotonic.max(...spaces.map(s => s.sizeFunction));
    return ORDINAL({ count: totalCount, sizeFunction: maxSize });
  }

  // If all are INTERVAL, max widths
  if (spaces.every(isINTERVAL)) {
    const maxWidth = Monotonic.max(...spaces.map(s => s.widthFunction));
    return INTERVAL(maxWidth);
  }

  // Default: UNDEFINED with max sizes
  const maxSize = Monotonic.max(...spaces.map(s => s.sizeFunction));
  return UNDEFINED({ sizeFunction: maxSize });
}

/**
 * Sum multiple underlying spaces.
 * Used by stack operator for stacking direction.
 */
export function sumSpaces(
  spaces: UnderlyingSpace[],
  spacing: number
): UnderlyingSpace {
  if (spacing === 0 && spaces.every(isPOSITION)) {
    // Stacked positions: concatenate domains, sum sizes
    const totalWidth = spaces.reduce(
      (sum, s) => sum + Interval.width(s.domain),
      0
    );
    const totalSize = Monotonic.add(...spaces.map(s => s.sizeFunction));
    return POSITION([0, totalWidth], { sizeFunction: totalSize });
  }

  if (spacing > 0 && spaces.every(isPOSITION)) {
    // Spaced positions become ORDINAL
    const count = spaces.length;
    const maxBucketSize = Monotonic.max(...spaces.map(s => s.sizeFunction));
    const totalSize = Monotonic.adds(maxBucketSize, spacing * (count - 1));
    return ORDINAL({ count, sizeFunction: totalSize, spacing });
  }

  // Generic ordinal sum
  const count = spaces.reduce((sum, s) =>
    sum + (isORDINAL(s) ? s.count ?? 1 : 1), 0);
  const totalSize = Monotonic.adds(
    Monotonic.add(...spaces.map(s => s.sizeFunction)),
    spacing * (count - 1)
  );
  return ORDINAL({ count, sizeFunction: totalSize, spacing });
}

/**
 * Convert space to interval (used by stack with middle alignment).
 */
export function toInterval(space: UnderlyingSpace): UnderlyingSpace {
  if (isPOSITION(space)) {
    return INTERVAL(space.sizeFunction, {
      source: `interval(${space.source})`
    });
  }
  if (isINTERVAL(space)) {
    return space;
  }
  // ORDINAL and UNDEFINED become INTERVAL with their size function
  return INTERVAL(space.sizeFunction);
}
```

---

## 4. Implementation Roadmap

### Phase 1: Enrich UnderlyingSpace Types ✅ (Partially Complete)

**Goal**: Add size functions to all space types without breaking existing code

**Files to Modify**:

1. **[underlyingSpace.ts](underlyingSpace.ts)** - Core type definitions
   - Add `sizeFunction: ScaleFactorFunction` to all four space types
   - Add `widthFunction` to INTERVAL_TYPE
   - Add `count` and `bucketSizes` to ORDINAL_TYPE
   - Update constructor functions (POSITION, INTERVAL, ORDINAL, UNDEFINED)
   - Add space algebra functions (maxSpaces, sumSpaces, toInterval)
   - Ensure backward compatibility (make new fields optional initially)

2. **[_node.ts](_node.ts#L112-113)** - Node class
   - Import ScaleFactorFunction type
   - No changes needed yet (types are backward compatible)

**Testing Strategy**:
- Verify existing tests still pass
- Add unit tests for space constructors
- Add unit tests for space algebra (maxSpaces, sumSpaces, toInterval)

**Estimated Complexity**: Medium
**Risk**: Low (additive changes, backward compatible)

---

### Phase 2: Update All Shape Nodes ✅ (Mostly Complete)

**Goal**: Make all leaf shapes return enriched UnderlyingSpace with size functions

**Files to Modify**:

1. **[shapes/rect.tsx](shapes/rect.tsx#L84-152)** - Rectangle shapes
   - Current: Returns POSITION with domain only
   - Update: Compute and include `sizeFunction`

   ```typescript
   resolveUnderlyingSpace: () => {
     // ... existing domain logic ...

     // NEW: Compute size function
     const sizeFunc = isValue(dims[0].size)
       ? Monotonic.linear(getValue(dims[0].size), 0)  // Data-driven
       : Monotonic.linear(0, dims[0].size ?? 0);       // Aesthetic

     return POSITION([min, min + size], {
       sizeFunction: sizeFunc,
       source: 'rect:x'
     });
   }
   ```

2. **[shapes/ellipse.tsx](shapes/ellipse.tsx)** - Ellipse shapes
   - Similar logic to rect
   - May need to handle radius vs width/height

3. **[shapes/petal.tsx](shapes/petal.tsx)** - Petal shapes
   - Similar logic to rect

4. **[shapes/text.tsx](shapes/text.tsx)** - Text shapes
   - May have complex intrinsic size from text measurement
   - Size function might need to be "unknown" monotonic

5. **[shapes/label.tsx](shapes/label.tsx)** - Label shapes
   - Similar to text

**Common Pattern**:
```typescript
const computeSpaceWithSize = (
  dim: { min?: MaybeValue<number>; size?: MaybeValue<number> },
  axis: string
): UnderlyingSpace => {
  // Determine space kind (existing logic)
  if (!isValue(dim.min) && !isValue(dim.size)) {
    return ORDINAL({ source: `${axis}:aesthetic-only` });
  }

  // Compute size function
  const sizeFunc = isValue(dim.size)
    ? Monotonic.linear(getValue(dim.size), 0)
    : Monotonic.linear(0, dim.size ?? 0);

  if (isAesthetic(dim.min) && isValue(dim.size)) {
    return INTERVAL(sizeFunc, { source: `${axis}:interval` });
  }

  // Compute domain
  const min = isValue(dim.min) ? getValue(dim.min) : 0;
  const size = isValue(dim.size) ? getValue(dim.size) : 0;
  return POSITION([min, min + size], {
    sizeFunction: sizeFunc,
    source: `${axis}:position`
  });
};
```

**Testing Strategy**:
- Verify each shape's space resolution includes size function
- Compare size function output to old `inferSizeDomains` output
- Visual regression tests on existing charts

**Estimated Complexity**: Medium
**Risk**: Low (isolated to shape implementations)

---

### Phase 3: Update Graphical Operators ⚠️ (In Progress)

**Goal**: Make operators compose spaces using new algebra

**Files to Modify**:

1. **[graphicalOperators/stack.tsx](graphicalOperators/stack.tsx#L92-159)** - Stack operator
   - Most complex operator, needs careful handling
   - Use `sumSpaces` for stack direction
   - Use `maxSpaces` or `toInterval` for align direction

   ```typescript
   resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
     const alignSpaces = children.map(c => c[alignDir]);
     const stackSpaces = children.map(c => c[stackDir]);

     // ALIGNMENT DIMENSION
     let alignSpace: UnderlyingSpace;
     if (alignment === "middle") {
       // Middle alignment: convert to intervals, then max
       const intervals = alignSpaces.map(toInterval);
       alignSpace = maxSpaces(...intervals);
     } else {
       // Start/end alignment: max spaces
       alignSpace = maxSpaces(...alignSpaces);
     }

     // STACKING DIMENSION
     const stackSpace = sumSpaces(stackSpaces, spacing);

     return {
       [stackDir]: stackSpace,
       [alignDir]: alignSpace,
     };
   }
   ```

2. **[graphicalOperators/layer.tsx](graphicalOperators/layer.tsx#L70-122)** - Layer operator
   - Simpler: just max spaces per axis

   ```typescript
   resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
     return [
       maxSpaces(...children.map(c => c[0])),
       maxSpaces(...children.map(c => c[1])),
     ];
   }
   ```

3. **[graphicalOperators/position.tsx](graphicalOperators/position.tsx#L25-61)** - Position operator
   - Creates POSITION space from x/y coordinates
   - Size function delegates to child

   ```typescript
   resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
     const childSpace = children[0]; // Assumes single child

     return [
       isValue(x)
         ? POSITION([getValue(x), getValue(x)], {
             sizeFunction: childSpace[0].sizeFunction,
             source: 'position:x'
           })
         : childSpace[0],
       // ... same for y ...
     ];
   }
   ```

4. **[graphicalOperators/wrap.tsx](graphicalOperators/wrap.tsx)** - Wrap operator
   - May need special handling for wrapping layout
   - Status: Not yet implemented (`resolveUnderlyingSpace` missing)

5. **[graphicalOperators/connect.tsx](graphicalOperators/connect.tsx)** - Connect operator
   - Already implemented (✅)
   - May need size function addition

6. **[graphicalOperators/enclose.tsx](graphicalOperators/enclose.tsx)** - Enclose operator
   - Already implemented (✅)
   - May need size function addition

**Testing Strategy**:
- Unit test space algebra functions
- Verify stack/layer compositions match old behavior
- Test all alignment modes (start, middle, end)
- Test spacing = 0 and spacing > 0 cases

**Estimated Complexity**: High (stack operator is complex)
**Risk**: Medium (affects many chart types)

---

### Phase 4: Update Coordinate Transforms ⚠️ (Needs Review)

**Goal**: Ensure coordinate transforms preserve space information

**Files to Modify**:

1. **[coordinateTransforms/coord.tsx](coordinateTransforms/coord.tsx#L109-145)** - Base coordinate transform
   - Current: Summarizes children (POSITION if all are, else ORDINAL)
   - Update: Preserve size functions through transformation

   ```typescript
   resolveUnderlyingSpace: (children: Size<UnderlyingSpace>[]) => {
     // Union child spaces per axis
     const xSpace = maxSpaces(...children.map(c => c[0]));
     const ySpace = maxSpaces(...children.map(c => c[1]));

     // Note: Coordinate transform may affect size functions
     // For polar, sizes in angular dimension might be scaled by radius
     // This might need transformation-specific logic

     return [xSpace, ySpace];
   }
   ```

**Complexity**: Need to consider how coordinate transforms affect sizing:
- **Linear transforms**: Size functions are unaffected (same scale factor applies)
- **Polar transforms**: Angular sizes scale with radius
- **Bipolar transforms**: Complex non-linear scaling

**Estimated Complexity**: High (requires coordinate geometry understanding)
**Risk**: Medium (affects transformed charts like polar/radial)

---

### Phase 5: Deprecate `inferPosDomains` ⭐ (GOAL)

**Goal**: Remove all `inferPosDomains` implementations and calls

**Files to Modify**:

1. **[gofish.tsx](gofish.tsx#L103)** - Remove `inferPosDomains` call
   ```typescript
   // DELETE THIS LINE:
   // const [posDomainX, posDomainY] = child.inferPosDomains();

   // UPDATE position scale creation to use ONLY underlyingSpace:
   const posScales = [
     underlyingSpaceX.kind === "position"
       ? computePosScale(
           continuous({
             value: [underlyingSpaceX.domain.min, underlyingSpaceX.domain.max],
             measure: "unit",
           }),
           w
         )
       : undefined,  // No fallback to posDomainX
     // ... same for Y ...
   ];
   ```

2. **[_node.ts](_node.ts#L114-116)** - Remove `_inferPosDomains` property
   ```typescript
   // DELETE:
   // private _inferPosDomains: (
   //   childPosDomains: Size<ContinuousDomain>[]
   // ) => FancySize<ContinuousDomain | undefined>;

   // DELETE from constructor:
   // this._inferPosDomains = inferPosDomains;

   // DELETE method:
   // public inferPosDomains(): Size<ContinuousDomain | undefined> { ... }
   ```

3. **All shape and operator files** - Remove `inferPosDomains` implementations
   - [shapes/rect.tsx](shapes/rect.tsx#L154-179)
   - [shapes/ellipse.tsx](shapes/ellipse.tsx)
   - [shapes/petal.tsx](shapes/petal.tsx)
   - [shapes/text.tsx](shapes/text.tsx)
   - [shapes/label.tsx](shapes/label.tsx)
   - [graphicalOperators/stack.tsx](graphicalOperators/stack.tsx#L161-211)
   - [graphicalOperators/layer.tsx](graphicalOperators/layer.tsx#L123-155)
   - [graphicalOperators/position.tsx](graphicalOperators/position.tsx#L35-50)
   - [graphicalOperators/connect.tsx](graphicalOperators/connect.tsx)
   - [graphicalOperators/wrap.tsx](graphicalOperators/wrap.tsx)
   - [graphicalOperators/enclose.tsx](graphicalOperators/enclose.tsx)
   - [coordinateTransforms/coord.tsx](coordinateTransforms/coord.tsx#L146-164)
   - [_ref.tsx](_ref.tsx)

4. **[domain.ts](domain.ts)** - Mark as deprecated (don't delete yet, used for scales)
   - `ContinuousDomain` type still needed for scale functions
   - `unifyContinuousDomains` no longer needed
   - Add deprecation comments

**Testing Strategy**:
- Comprehensive visual regression tests
- Ensure all existing examples render identically
- Test continuous axes on all chart types
- Verify no console errors about missing domains

**Estimated Complexity**: Medium
**Risk**: High (affects core rendering pipeline)
**Prerequisites**: Phases 1-4 must be 100% complete

---

### Phase 6: Deprecate `inferSizeDomains` ⭐ (ULTIMATE GOAL)

**Goal**: Remove all `inferSizeDomains` implementations and use `UnderlyingSpace.sizeFunction` instead

**Files to Modify**:

1. **[gofish.tsx](gofish.tsx#L104)** - Remove `inferSizeDomains` call
   ```typescript
   // DELETE THIS LINE:
   // const sizeDomains = child.inferSizeDomains();

   // INSTEAD: Get size functions from underlying space
   const [underlyingSpaceX, underlyingSpaceY] = child.resolveUnderlyingSpace();
   ```

2. **[_node.ts](_node.ts#L250-268)** - Update `layout` method signature
   ```typescript
   // CURRENT:
   public layout(
     size: Size,
     scaleFactors: Size<number | undefined>,
     posScales: Size<((pos: number) => number) | undefined>
   ): Placeable {
     const { intrinsicDims, transform, renderData } = this._layout(
       this.shared,
       size,
       scaleFactors,     // Passed from parent
       this.children,
       this.sizeDomains, // From inferSizeDomains
       posScales
     );
   }

   // NEW:
   public layout(
     size: Size,
     scaleFactors: Size<number | undefined>,
     posScales: Size<((pos: number) => number) | undefined>
   ): Placeable {
     // Extract size functions from underlying space
     const [spaceX, spaceY] = this.resolveUnderlyingSpace();
     const sizeFunctions = [spaceX.sizeFunction, spaceY.sizeFunction];

     const { intrinsicDims, transform, renderData } = this._layout(
       this.shared,
       size,
       scaleFactors,
       this.children,
       sizeFunctions,  // Use underlying space size functions
       posScales
     );
   }
   ```

3. **Update Layout type signature** ([_node.ts](_node.ts#L68-77)):
   ```typescript
   // CURRENT:
   export type Layout = (
     shared: Size<boolean>,
     size: Size,
     scaleFactors: Size<number | undefined>,
     children: GoFishNode[],
     measurement: Size<ScaleFactorFunction>,  // OLD: called "measurement"
     posScales: Size<((pos: number) => number) | undefined>
   ) => { ... };

   // NEW: Rename "measurement" to "sizeFunctions" for clarity
   export type Layout = (
     shared: Size<boolean>,
     size: Size,
     scaleFactors: Size<number | undefined>,
     children: GoFishNode[],
     sizeFunctions: Size<ScaleFactorFunction>,  // From underlying space
     posScales: Size<((pos: number) => number) | undefined>
   ) => { ... };
   ```

4. **All shape and operator files** - Remove `inferSizeDomains` implementations
   - Each layout function already receives `sizeFunctions` parameter
   - They were computing it locally via `inferSizeDomains()`
   - Now they'll use the passed parameter from `resolveUnderlyingSpace`

   Example in [shapes/rect.tsx](shapes/rect.tsx#L181-186):
   ```typescript
   // DELETE:
   // inferSizeDomains: (shared, children) => {
   //   return {
   //     w: computeIntrinsicSize(dims[0].size),
   //     h: computeIntrinsicSize(dims[1].size),
   //   };
   // },

   // layout function already receives sizeFunctions parameter and uses it
   // No changes needed to layout!
   ```

5. **Remove size domain property** ([_node.ts](_node.ts#L125)):
   ```typescript
   // DELETE:
   // private sizeDomains: Size<ScaleFactorFunction>;

   // DELETE from inferSizeDomains method:
   // public inferSizeDomains(): Size<ScaleFactorFunction> {
   //   const sizeDomains = elaborateSize(
   //     this._inferSizeDomains(this.shared, this.children)
   //   );
   //   this.sizeDomains = sizeDomains;  // DELETE
   //   return sizeDomains;
   // }
   ```

**Key Insight**: The layout functions are **already parameterized** by size functions! They receive a `measurement` parameter (confusingly named, really means "size functions"). The `inferSizeDomains` pass was computing these functions and storing them. Once we have size functions in `UnderlyingSpace`, we can just extract them from there instead.

**Testing Strategy**:
- Extensive visual regression tests
- Test all chart types (bar, scatter, line, area, etc.)
- Test stacking (edge-to-edge and center-to-center)
- Test layering
- Test wrapping
- Test coordinate transforms (polar, bipolar)
- Verify layout constraint solving still works
- Test scale factor inversion for nested charts

**Estimated Complexity**: High
**Risk**: Very High (affects core layout system)
**Prerequisites**: Phases 1-5 must be complete and thoroughly tested

---

## 5. Detailed File Inventory

### 5.1 Files Requiring Changes

| File | Phase | Status | Complexity | Notes |
|------|-------|--------|------------|-------|
| [underlyingSpace.ts](underlyingSpace.ts) | 1 | ⚠️ Partial | Medium | Add size functions to types, space algebra |
| [_node.ts](_node.ts) | 1, 5, 6 | ⚠️ Partial | High | Core node class, multiple phases |
| [gofish.tsx](gofish.tsx) | 5, 6 | ❌ Pending | High | Main rendering pipeline |
| [shapes/rect.tsx](shapes/rect.tsx) | 2, 5, 6 | ✅ Partial | Medium | Most common shape |
| [shapes/ellipse.tsx](shapes/ellipse.tsx) | 2, 5, 6 | ✅ Partial | Medium | Ellipse/circle shapes |
| [shapes/petal.tsx](shapes/petal.tsx) | 2, 5, 6 | ✅ Partial | Medium | Petal shapes |
| [shapes/text.tsx](shapes/text.tsx) | 2, 5, 6 | ✅ Partial | High | Text measurement complexity |
| [shapes/label.tsx](shapes/label.tsx) | 2, 5, 6 | ✅ Partial | High | Label positioning |
| [graphicalOperators/stack.tsx](graphicalOperators/stack.tsx) | 3, 5, 6 | ✅ Partial | Very High | Most complex operator |
| [graphicalOperators/layer.tsx](graphicalOperators/layer.tsx) | 3, 5, 6 | ✅ Partial | Medium | Overlay operator |
| [graphicalOperators/position.tsx](graphicalOperators/position.tsx) | 3, 5, 6 | ✅ Partial | Low | Simple positioning |
| [graphicalOperators/connect.tsx](graphicalOperators/connect.tsx) | 3, 5, 6 | ✅ Done | Medium | Line connections |
| [graphicalOperators/wrap.tsx](graphicalOperators/wrap.tsx) | 3, 5, 6 | ❌ Missing | High | Not yet implemented |
| [graphicalOperators/enclose.tsx](graphicalOperators/enclose.tsx) | 3, 5, 6 | ✅ Done | Low | Simple enclosure |
| [coordinateTransforms/coord.tsx](coordinateTransforms/coord.tsx) | 4, 5, 6 | ✅ Partial | High | Transform base class |
| [_ref.tsx](_ref.tsx) | 3, 5, 6 | ✅ Done | Medium | Reference nodes |
| [domain.ts](domain.ts) | 5 | ❌ Pending | Low | Mark as deprecated |

**Total Files**: 17
**Completed**: 7 (41%)
**Partial**: 9 (53%)
**Pending**: 1 (6%)

### 5.2 Files NOT Requiring Changes

- **[interval.ts](interval.ts)** - Interval utility, used by underlyingSpace
- **[monotonic.ts](monotonic.ts)** - Monotonic function algebra, already complete
- **[data.ts](data.ts)** - Data/aesthetic value system, orthogonal
- **[dims.ts](dims.ts)** - Dimension types, layout-only
- **Test files** - Will need updates for new behavior

### 5.3 New Files to Create

Potentially create a new file to centralize space algebra:

- **`spaceAlgebra.ts`** (optional)
  - Move `maxSpaces`, `sumSpaces`, `toInterval` from underlyingSpace.ts
  - Add more sophisticated composition functions
  - Handle edge cases (empty children, mixed types)

---

## 6. Critical Implementation Challenges

### 6.1 Challenge: Scale Factor Solving

**Problem**: The current system solves for scale factors by inverting size domain functions. This happens implicitly during layout. With the new system, we need to ensure size functions in `UnderlyingSpace` can be inverted the same way.

**Current Code** (implicit, happens in layout functions like [stack.tsx:248-295](stack.tsx#L248-L295)):
```typescript
layout: (shared, size, scaleFactors, children, measurement, posScales) => {
  const stackScaleFactor =
    scaleFactors?.[stackDir] ??
    (measurement[stackDir]
      ? findScaleFactor(measurement[stackDir], size[stackDir], {...})
      : undefined);

  // Use stackScaleFactor to compute child sizes
}
```

**Solution**: Size functions in `UnderlyingSpace` must be `Monotonic.Monotonic` types that have both `run` and `inverse` methods. This is already the case in our design:

```typescript
type UnderlyingSpace = {
  sizeFunction: ScaleFactorFunction;  // = Monotonic.Monotonic
}

// Monotonic already has inverse:
type Monotonic = {
  run: (x: number) => number;
  inverse: (y: number) => number | undefined;
}
```

**Action**: Ensure all size function construction uses `Monotonic.*` functions from [monotonic.ts](monotonic.ts).

### 6.2 Challenge: Ordinal Layout with Heterogeneous Buckets

**Problem**: When ordinal buckets have different sizes (e.g., grouped bars with different heights), how do we represent this?

**Example**:
```typescript
stack([
  rect({ x: aesthetic('Q1'), w: value(10), h: value(100) }),
  rect({ x: aesthetic('Q2'), w: value(10), h: value(150) }),
  rect({ x: aesthetic('Q3'), w: value(10), h: value(80) }),
], { spacing: 5, direction: 'horizontal' })
```

In the horizontal (stack) direction:
- All buckets have same width: `10*sf`
- Total width: `10*sf + 5 + 10*sf + 5 + 10*sf = 30*sf + 10`
- Space type: ORDINAL with `count=3`, `sizeFunction=linear(30, 10)`

In the vertical (align) direction:
- Buckets have different heights: `100*sf`, `150*sf`, `80*sf`
- Need to align to max: `150*sf`
- Space type: POSITION (if start/end align) or INTERVAL (if middle align)

**Current System** ([stack.tsx:213-246](stack.tsx#L213-L246)):
```typescript
inferSizeDomains: (shared, children) => {
  return {
    [stackDir]: Monotonic.adds(
      Monotonic.add(...childSizeDomainsStackDir),
      spacing * (children.length - 1)
    ),
    [alignDir]: Monotonic.max(...childSizeDomainsAlignDir),
  };
}
```

**New System**: Need to capture this in ORDINAL space:
```typescript
// Stack direction
const stackSpace = ORDINAL({
  count: children.length,
  bucketSizes: children.map(c => c[stackDir].sizeFunction),
  sizeFunction: Monotonic.adds(
    Monotonic.add(...children.map(c => c[stackDir].sizeFunction)),
    spacing * (children.length - 1)
  ),
  spacing,
});

// Align direction (max of children)
const alignSpace = maxSpaces(...children.map(c => c[alignDir]));
```

**Action**: Implement and test `bucketSizes` tracking in ORDINAL spaces.

### 6.3 Challenge: Coordinate Transform Size Functions

**Problem**: Coordinate transforms (polar, bipolar, wavy) may affect how sizes scale. A fixed-width bar in Cartesian space becomes arc-length dependent in polar space.

**Example**:
```typescript
polar(
  rect({ x: value(0), w: value(10), y: value(5), h: value(20) }),
  { innerRadius: 50 }
)

// In Cartesian: width=10*sf, height=20*sf
// In Polar:
//   - x → angle, w → angular width (scales same)
//   - y → radius, h → radial height (scales same)
//   BUT: arc length = angle * radius
//   So effective width at y=5 is: 10*sf * 5*sf (non-linear!)
```

**Current System**: Coordinate transforms don't modify size domains, they just transform during rendering.

**New System Options**:
1. **Keep size functions in data space** (don't transform them)
   - Size functions represent data-space requirements
   - Coordinate transform happens during rendering only
   - **Advantage**: Simpler, matches current behavior
   - **Disadvantage**: Size functions don't reflect device space needs

2. **Transform size functions** (account for coordinate transform)
   - Size functions represent device-space requirements
   - Need transformation-specific scaling
   - **Advantage**: More accurate size prediction
   - **Disadvantage**: Very complex, may break monotonicity

**Recommendation**: **Option 1** (keep size functions in data space)
- Size functions represent "logical" size in data coordinates
- Coordinate transforms are rendering-only transformations
- Layout still happens in data space
- This matches the current architecture

**Action**: Document that size functions are **pre-transform** sizes. Add comments to clarify this.

### 6.4 Challenge: Backward Compatibility During Migration

**Problem**: During Phases 2-4, some nodes will have enriched `UnderlyingSpace` while others don't. Code must handle both.

**Solution**: Make size functions optional initially:
```typescript
type POSITION_TYPE = {
  kind: "position";
  domain: Interval;
  sizeFunction?: ScaleFactorFunction;  // Optional during migration
  ...
}
```

**Fallback in gofish.tsx**:
```typescript
const sizeFunctionX = underlyingSpaceX.sizeFunction
  ?? (posDomainX ? Monotonic.linear(posDomainX.value[1] - posDomainX.value[0], 0)
                 : Monotonic.linear(0, 0));
```

**Action**: Add fallback logic during Phases 2-4, remove in Phase 6.

### 6.5 Challenge: Testing and Validation

**Problem**: How do we ensure the new system produces identical results to the old system?

**Solution**: Dual-path testing during migration:
1. Run both `inferSizeDomains` and `resolveUnderlyingSpace.sizeFunction`
2. Compare outputs and log any differences
3. Add assertion in debug mode:
   ```typescript
   if (debug) {
     const oldSizeDomain = child.inferSizeDomains();
     const newSizeDomain = [
       child.resolveUnderlyingSpace()[0].sizeFunction,
       child.resolveUnderlyingSpace()[1].sizeFunction,
     ];

     // Test at multiple scale factors
     for (const sf of [0.5, 1.0, 2.0]) {
       const oldW = oldSizeDomain[0].run(sf);
       const newW = newSizeDomain[0].run(sf);
       if (Math.abs(oldW - newW) > 0.001) {
         console.error('Size function mismatch!', {sf, oldW, newW});
       }
     }
   }
   ```

**Action**: Add validation mode to gofish.tsx, enable during Phases 2-5.

---

## 7. Example Transformations

### 7.1 Simple Rect (Data-Driven Size)

**Current Code**:
```typescript
rect({ x: value(0), w: value(10), y: value(0), h: value(100) })

// inferPosDomains returns:
[
  continuous({ value: [0, 10], measure: "unit" }),
  continuous({ value: [0, 100], measure: "unit" })
]

// inferSizeDomains returns:
[
  Monotonic.linear(10, 0),  // f(sf) = 10*sf
  Monotonic.linear(100, 0)  // f(sf) = 100*sf
]
```

**New Code**:
```typescript
rect({ x: value(0), w: value(10), y: value(0), h: value(100) })

// resolveUnderlyingSpace returns:
[
  POSITION([0, 10], {
    sizeFunction: Monotonic.linear(10, 0),
    source: 'rect:x'
  }),
  POSITION([0, 100], {
    sizeFunction: Monotonic.linear(100, 0),
    source: 'rect:y'
  })
]
```

**Changes**:
- ✅ Domain preserved in `POSITION.domain`
- ✅ Size function included in `POSITION.sizeFunction`
- ✅ Single pass computes both

### 7.2 Stacked Bar Chart

**Current Code**:
```typescript
stack([
  rect({ x: value(0), w: value(10) }),
  rect({ x: value(10), w: value(15) }),
  rect({ x: value(25), w: value(8) }),
], { direction: 'horizontal', spacing: 0 })

// inferPosDomains (stack direction) returns:
continuous({ value: [0, 33], measure: "unit" })  // Union: [0,10] ∪ [10,25] ∪ [25,33]

// inferSizeDomains (stack direction) returns:
Monotonic.linear(33, 0)  // f(sf) = (10+15+8)*sf = 33*sf
```

**New Code**:
```typescript
stack([
  rect({ x: value(0), w: value(10) }),   // POSITION([0,10], sf=linear(10,0))
  rect({ x: value(10), w: value(15) }),  // POSITION([10,25], sf=linear(15,0))
  rect({ x: value(25), w: value(8) }),   // POSITION([25,33], sf=linear(8,0))
], { direction: 'horizontal', spacing: 0 })

// resolveUnderlyingSpace (stack direction) returns:
sumSpaces(children, 0) =
  POSITION([0, 33], {
    sizeFunction: Monotonic.linear(33, 0),  // sum of widths
    source: 'stack:horizontal'
  })
```

**Changes**:
- ✅ Domain computed via `sumSpaces` helper
- ✅ Size function is sum of child size functions
- ✅ Single traversal instead of two

### 7.3 Layered Chart

**Current Code**:
```typescript
layer([
  rect({ x: value(0), w: value(100), h: 50 }),   // Data width, aesthetic height
  rect({ x: value(50), w: value(75), h: 100 }),  // Different domain
])

// inferPosDomains returns:
[
  continuous({ value: [0, 175], measure: "unit" }),  // Union [0,100] ∪ [50,125]
  undefined  // No y domain (both heights aesthetic)
]

// inferSizeDomains returns:
[
  Monotonic.linear(100, 0),  // max(100*sf, 75*sf) = 100*sf
  Monotonic.linear(0, 100)   // max(50, 100) = 100
]
```

**New Code**:
```typescript
layer([
  rect({ x: value(0), w: value(100), h: 50 }),
  // → [POSITION([0,100], sf=linear(100,0)), ORDINAL(sf=linear(0,50))]

  rect({ x: value(50), w: value(75), h: 100 }),
  // → [POSITION([50,125], sf=linear(75,0)), ORDINAL(sf=linear(0,100))]
])

// resolveUnderlyingSpace returns:
[
  maxSpaces(
    POSITION([0,100], sf=linear(100,0)),
    POSITION([50,125], sf=linear(75,0))
  ) = POSITION([0,125], {
    sizeFunction: Monotonic.max(linear(100,0), linear(75,0)) = linear(100,0),
    source: 'layer:x'
  }),

  maxSpaces(
    ORDINAL(sf=linear(0,50)),
    ORDINAL(sf=linear(0,100))
  ) = ORDINAL({
    sizeFunction: Monotonic.max(linear(0,50), linear(0,100)) = linear(0,100),
    source: 'layer:y'
  })
]
```

**Changes**:
- ✅ X domain is union via `maxSpaces`
- ✅ Y has no domain (ORDINAL) but still has size function
- ✅ Size functions computed via `Monotonic.max`

### 7.4 Grouped Bar Chart (Ordinal)

**Current Code**:
```typescript
stack([
  rect({ x: aesthetic('Q1'), w: value(10), h: value(100) }),
  rect({ x: aesthetic('Q2'), w: value(10), h: value(150) }),
  rect({ x: aesthetic('Q3'), w: value(10), h: value(80) }),
], { direction: 'horizontal', spacing: 5 })

// inferPosDomains (stack direction) returns:
undefined  // No continuous domain (x is aesthetic)

// inferSizeDomains (stack direction) returns:
Monotonic.adds(
  Monotonic.add(linear(10,0), linear(10,0), linear(10,0)),
  5 * 2
) = Monotonic.linear(30, 10)  // f(sf) = 30*sf + 10
```

**New Code**:
```typescript
stack([
  rect({ x: aesthetic('Q1'), w: value(10), h: value(100) }),
  // → [ORDINAL, POSITION([0,100], sf=linear(100,0))]

  rect({ x: aesthetic('Q2'), w: value(10), h: value(150) }),
  // → [ORDINAL, POSITION([0,150], sf=linear(150,0))]

  rect({ x: aesthetic('Q3'), w: value(10), h: value(80) }),
  // → [ORDINAL, POSITION([0,80], sf=linear(80,0))]
], { direction: 'horizontal', spacing: 5 })

// resolveUnderlyingSpace (stack direction) returns:
sumSpaces([ORDINAL, ORDINAL, ORDINAL], spacing=5) =
  ORDINAL({
    count: 3,
    bucketSizes: [linear(10,0), linear(10,0), linear(10,0)],
    sizeFunction: Monotonic.linear(30, 10),
    spacing: 5,
    source: 'stack:horizontal:ordinal'
  })

// Align direction (vertical):
maxSpaces(
  POSITION([0,100], sf=linear(100,0)),
  POSITION([0,150], sf=linear(150,0)),
  POSITION([0,80], sf=linear(80,0))
) = POSITION([0,150], {
  sizeFunction: linear(150, 0),
  source: 'stack:vertical:align'
})
```

**Changes**:
- ✅ Stack direction becomes ORDINAL with explicit count and bucket sizes
- ✅ Align direction is POSITION with max domain and max size
- ✅ Spacing incorporated into size function

---

## 8. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Breaking rendering** | High | Medium | Extensive visual regression testing, dual-path validation |
| **Performance regression** | Medium | Low | Benchmark before/after, optimize monotonic algebra if needed |
| **Incomplete migration** | High | Medium | Strict phase ordering, comprehensive file inventory |
| **Coordinate transform issues** | High | Medium | Keep size functions in data space, test all transforms |
| **Ordinal layout bugs** | Medium | High | Careful testing of grouped/stacked charts with spacing |
| **Missing edge cases** | Medium | High | Review all existing examples, add edge case tests |

---

## 9. Success Criteria

**Phase 5 (inferPosDomains deprecation) is successful when**:
- ✅ All nodes implement `resolveUnderlyingSpace` with domain information
- ✅ POSITION spaces contain accurate domains
- ✅ `gofish.tsx` no longer calls `child.inferPosDomains()`
- ✅ Position scales created exclusively from `underlyingSpace.domain`
- ✅ All existing examples render identically
- ✅ No console errors about undefined domains
- ✅ All continuous axes display correctly

**Phase 6 (inferSizeDomains deprecation) is successful when**:
- ✅ All nodes have size functions in their underlying spaces
- ✅ `gofish.tsx` no longer calls `child.inferSizeDomains()`
- ✅ Layout functions use `underlyingSpace.sizeFunction` exclusively
- ✅ Scale factor solving still works correctly
- ✅ All stacking modes work (edge-to-edge, center-to-center)
- ✅ All alignment modes work (start, middle, end)
- ✅ Ordinal spacing works correctly
- ✅ Coordinate transforms work correctly
- ✅ All existing examples render identically
- ✅ Performance is equal or better
- ✅ Code is simpler (fewer passes, less duplication)

---

## 10. Recommendations

### Immediate Next Steps

1. **Complete Phase 1**: Enrich `UnderlyingSpace` types
   - Add `sizeFunction` to all four space types
   - Implement space algebra functions (`maxSpaces`, `sumSpaces`, `toInterval`)
   - Write unit tests for space constructors and algebra
   - **Estimated effort**: 2-3 days

2. **Complete Phase 2**: Update remaining shapes
   - Ensure all shapes return size functions
   - Validate against old `inferSizeDomains` output
   - **Estimated effort**: 1-2 days

3. **Complete Phase 3**: Finish operator implementations
   - Priority: `wrap` operator (currently missing `resolveUnderlyingSpace`)
   - Validate `stack` and `layer` size functions
   - **Estimated effort**: 2-3 days

4. **Add Validation Mode**: Implement dual-path testing
   - Run both old and new systems side-by-side
   - Log any discrepancies
   - Add to `gofish.tsx` behind debug flag
   - **Estimated effort**: 1 day

5. **Phase 5 Execution**: Deprecate `inferPosDomains`
   - Remove all `inferPosDomains` implementations
   - Update `gofish.tsx` to use only `underlyingSpace.domain`
   - Extensive visual regression testing
   - **Estimated effort**: 2-3 days

6. **Phase 6 Execution**: Deprecate `inferSizeDomains`
   - Remove all `inferSizeDomains` implementations
   - Update layout to use `underlyingSpace.sizeFunction`
   - Extensive layout and scaling tests
   - **Estimated effort**: 3-4 days

**Total Estimated Effort**: 11-17 days

### Long-term Architectural Benefits

Once complete, the unified system will provide:

1. **Simpler Mental Model**
   - One pass instead of three
   - Space type directly encodes both domain and size information
   - Easier to understand for new contributors

2. **Better Composability**
   - Space algebra makes operator composition explicit
   - Helper functions (`maxSpaces`, `sumSpaces`) reduce duplication
   - Easier to add new operators

3. **More Expressive**
   - INTERVAL spaces formalize streamgraph semantics
   - ORDINAL spaces make discrete layout explicit
   - POSITION spaces unify domain and sizing

4. **Performance**
   - Fewer tree traversals (one pass vs three)
   - Cached results in `_underlyingSpace`
   - Potential for better optimization

5. **Debugging**
   - `source` field provides provenance tracking
   - Can visualize the underlying space tree
   - Easier to trace where domains come from

### Alternative Approaches Considered

**Alternative 1: Keep Three Separate Passes**
- **Pro**: No migration needed, lower risk
- **Con**: Conceptual duplication, harder to maintain
- **Verdict**: ❌ Rejected - technical debt would accumulate

**Alternative 2: Merge Only inferPosDomains**
- **Pro**: Partial benefit, lower risk than full unification
- **Con**: Still have two passes, size domains separate
- **Verdict**: ⚠️ Possible interim step, but incomplete

**Alternative 3: Completely New System (Rewrite)**
- **Pro**: Could redesign from scratch with lessons learned
- **Con**: Very high risk, would break everything
- **Verdict**: ❌ Rejected - too disruptive

**Selected Approach: Incremental Enrichment**
- **Pro**: Low risk, backward compatible during migration, clear phases
- **Con**: Requires careful coordination, temporary duplication
- **Verdict**: ✅ Recommended

---

## Appendix A: Type Definitions

### Current Types

```typescript
// domain.ts
type ContinuousDomain = {
  type: "continuous";
  value: [number, number];
  measure: Measure;
}

// monotonic.ts
type Monotonic = {
  kind: "linear" | "unknown";
  run: (x: number) => number;
  inverse: (y: number, opts?) => number | undefined;
}

// underlyingSpace.ts (CURRENT)
type UnderlyingSpace =
  | { kind: "position"; domain: Interval; ... }
  | { kind: "interval"; width: number; ... }
  | { kind: "ordinal"; ... }
  | { kind: "undefined"; ... }
```

### Proposed Types

```typescript
// underlyingSpace.ts (PROPOSED)
type UnderlyingSpace =
  | POSITION_TYPE
  | INTERVAL_TYPE
  | ORDINAL_TYPE
  | UNDEFINED_TYPE;

type POSITION_TYPE = {
  kind: "position";
  domain: Interval;
  sizeFunction: ScaleFactorFunction;  // NEW
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type INTERVAL_TYPE = {
  kind: "interval";
  width: number;  // Deprecated
  widthFunction: ScaleFactorFunction;  // NEW
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type ORDINAL_TYPE = {
  kind: "ordinal";
  count?: number;  // NEW
  bucketSizes?: ScaleFactorFunction[];  // NEW
  sizeFunction: ScaleFactorFunction;  // NEW
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type UNDEFINED_TYPE = {
  kind: "undefined";
  sizeFunction: ScaleFactorFunction;  // NEW
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
}

type ScaleFactorFunction = Monotonic.Monotonic;
```

---

## Appendix B: Glossary

- **Underlying Space**: Classification of what kind of data space an axis represents (position, interval, ordinal, undefined)
- **Position Space**: Absolute coordinates matter (e.g., scatter plot)
- **Interval Space**: Relative distances matter but not absolute position (e.g., streamgraph)
- **Ordinal Space**: Categorical ordering with discrete positioning (e.g., bar chart categories)
- **Domain**: The range of data values on an axis (e.g., [0, 100])
- **Size Function**: A monotonic function mapping scale factors to required device space
- **Scale Factor**: A multiplier applied to data-driven sizes during layout
- **Monotonic Function**: A function that preserves order (never decreases or never increases)
- **Device Space**: Pixel coordinates on the rendered canvas
- **Data Space**: Logical coordinates in the domain of the data
- **Aesthetic Value**: A constant or non-data-driven value (e.g., `50` pixels)
- **Data Value**: A value bound to data (e.g., `value(50)` from dataset)

---

## Conclusion

Unifying `inferPosDomains` and `inferSizeDomains` into `resolveUnderlyingSpace` is **architecturally sound** and **feasible**, but requires:

1. **Enriching UnderlyingSpace** with size functions for all space types
2. **Implementing space algebra** (maxSpaces, sumSpaces, toInterval)
3. **Updating all shapes and operators** to compute size functions
4. **Careful migration** through well-defined phases
5. **Extensive testing** with visual regression and validation

The refactor is **in progress** (41% complete) and on a **good trajectory**. The main remaining work is:
- ✅ Phase 1: Complete type enrichment (70% done)
- ⚠️ Phase 2: Finish shape updates (mostly done, needs validation)
- ⚠️ Phase 3: Complete operator updates (wrap operator missing)
- ❌ Phase 4: Review coordinate transforms
- ❌ Phase 5: Deprecate `inferPosDomains` **(CRITICAL MILESTONE)**
- ❌ Phase 6: Deprecate `inferSizeDomains` **(ULTIMATE GOAL)**

**Recommended Focus**: Complete Phases 1-3, add validation mode, then proceed to Phase 5 (deprecate `inferPosDomains`). Phase 6 can follow once Phase 5 is proven stable.

**Total Estimated Effort to Completion**: 11-17 days of focused development work.
