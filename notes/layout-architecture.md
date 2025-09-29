# GoFish Layout Architecture

This document describes the multi-pass layout architecture used in the GoFish charting system. The architecture follows a structured approach where each pass builds upon the previous one to transform a declarative chart specification into a rendered visualization.

## Overview

The GoFish layout system processes chart specifications through several distinct passes:

1. **Context Initialization**
2. **Color Scale Resolution**
3. **Name Resolution**
4. **Key Resolution**
5. **Position Domain Inference**
6. **Size Domain Inference**
7. **Layout Calculation**
8. **Placement**
9. **Rendering**

## Global Context Management

The system maintains three global contexts throughout the layout process:

### Scope Context (`scopeContext`)

- Type: `ScopeContext` (extends `Map`)
- Purpose: Manages variable scoping and data binding across the chart tree
- Lifecycle: Initialized at the start of each chart render, cleaned up at the end

### Scale Context (`scaleContext`)

- Type: `ScaleContext = { [measure: string]: { color: Map<any, string> } }`
- Purpose: Stores computed color scales and other scale mappings
- Default: `{ unit: { color: new Map() } }`
- Lifecycle: Populated during color resolution pass, used during rendering

### Key Context (`keyContext`)

- Type: `KeyContext = { [key: string]: GoFishNode }`
- Purpose: Maps string keys to their corresponding nodes for efficient lookup
- Used for: Axis labeling, legend generation, and node references

## Layout Passes

### 1. Context Initialization

```typescript
scopeContext = new Map();
scaleContext = { unit: { color: new Map() } };
keyContext = {};
```

- Establishes clean global state for the rendering process
- Ensures no interference between multiple chart renders

### 2. Color Scale Resolution

```typescript
child.resolveColorScale();
```

- **Purpose**: Analyzes the chart tree to determine color mappings
- **Process**:
  - Traverses all nodes to identify color encodings
  - Computes appropriate color scales based on data types
  - Populates the `scaleContext.color` maps
- **Output**: Color scales stored in `scaleContext`

### 3. Name Resolution

```typescript
child.resolveNames();
```

- **Purpose**: Resolves variable names and data bindings
- **Process**:
  - Maps data field names to their corresponding values
  - Establishes scope relationships between parent and child nodes
  - Populates the `scopeContext` with resolved bindings
- **Output**: Name bindings stored in `scopeContext`

### 4. Key Resolution

```typescript
child.resolveKeys();
```

- **Purpose**: Assigns unique identifiers to chart elements
- **Process**:
  - Generates keys for nodes that need identification
  - Maps keys to their corresponding nodes in `keyContext`
  - Enables efficient lookup during rendering (axes, legends)
- **Output**: Key-to-node mappings stored in `keyContext`

### 5. Position Domain Inference

```typescript
const [posDomainX, posDomainY] = child.inferPosDomains();
```

- **Purpose**: Determines the data domains for position encodings
- **Process**:
  - Analyzes position mappings (x, y coordinates)
  - Computes min/max bounds for each dimension
  - Handles both continuous and discrete position scales
- **Output**: Domain ranges for X and Y dimensions
- **Usage**: Used to compute position scales for layout

### 6. Size Domain Inference

```typescript
const sizeDomains = child.inferSizeDomains();
```

- **Purpose**: Determines the data domains for size encodings
- **Process**:
  - Analyzes size mappings (width, height, radius, etc.)
  - Computes size ranges for visual elements
  - Distinguishes between constant and variable size encodings
- **Output**: Size domain information for both dimensions
- **Usage**: Used for axis generation and legend positioning

### 7. Layout Calculation

```typescript
child.layout(
  [w, h], // Available space
  [undefined, undefined], // Intrinsic dimensions (computed)
  [
    // Position scales
    posDomainX ? computePosScale(posDomainX, w) : undefined,
    posDomainY ? computePosScale(posDomainY, h) : undefined,
  ]
);
```

- **Purpose**: Computes the actual positions and sizes of all chart elements
- **Process**:
  - Applies layout algorithms (stacking, positioning, etc.)
  - Calculates intrinsic dimensions for each node
  - Determines final positions within the available space
  - Handles nested layouts and complex arrangements
- **Input**: Available space, position scales
- **Output**: Updated node properties with computed positions and sizes

### 8. Placement

```typescript
child.place({ x: x ?? transform?.x ?? 0, y: y ?? transform?.y ?? 0 });
```

- **Purpose**: Applies final positioning transforms to the entire chart
- **Process**:
  - Translates the entire chart to its final position
  - Handles user-specified offsets and transformations
  - Ensures proper positioning within the container
- **Input**: Offset coordinates
- **Output**: Final chart position

### 9. Rendering

```typescript
solidRender(() => render({...}, child), container);
```

- **Purpose**: Converts the processed chart tree into SVG elements
- **Process**:
  - Traverses the layout tree to generate SVG
  - Applies visual styling and transformations
  - Renders axes, legends, and annotations if requested
  - Uses SolidJS for reactive rendering

## Rendering Features

The render function supports several additional features:

### Axes Generation

- **Continuous Axes**: For quantitative data with tick marks and labels
- **Discrete Axes**: For categorical data with category labels
- **Dynamic Sizing**: Axes adjust based on available space and data domains

### Legend Generation

- **Color Legend**: Maps color values to their data categories
- **Positioning**: Automatically positioned to avoid chart overlap
- **Styling**: Consistent with the overall chart theme

### Coordinate System

- **SVG Transform**: `scale(1, -1)` flips Y-axis for mathematical coordinate system
- **Padding**: Consistent spacing around chart elements
- **Responsive**: Adapts to different container sizes

## Debug Support

The system includes comprehensive debugging capabilities:

```typescript
if (debug) {
  debugNodeTree(child);
  console.log("scopeContext", scopeContext);
}
```

- **Node Tree Debugging**: Visualizes the complete chart tree structure
- **Context Logging**: Outputs all context information for inspection
- **Development Aid**: Helps identify layout issues and optimization opportunities

## Error Handling

The system includes proper cleanup and error handling:

```typescript
try {
  // Layout passes...
} finally {
  // Context cleanup
  scopeContext = null;
  scaleContext = null;
  keyContext = null;
}
```

- **Context Cleanup**: Ensures no memory leaks between renders
- **Error Recovery**: Maintains system stability even with malformed charts
- **Resource Management**: Proper cleanup of temporary resources

## Performance Considerations

- **Single Traversal**: Each pass traverses the tree only once when possible
