---
pageClass: api-page
---

# API Reference

The GoFish API for creating charts and visualizations.

By combining operators and marks, you can create complex and automatic chart layouts.

## How To

- [Create a chart](/api/howto/create-chart) Build charts using Chart, flow, mark, and render.
- [Create a glyph](/api/howto/create-glyph) Compose custom shapes with Layer.
- [Pick a layout operator](/api/howto/operators) Choose between spread, stack, and scatter.
- [Use selection](/api/howto/selection) Connect marks across charts for overlays and annotations.

## Core

- [chart](/api/core/chart) Creates a ChartBuilder for building charts.
- [flow](/api/core/flow) Applies operators to the data pipeline.
- [mark](/api/core/mark) Sets the visual mark for rendering.
- [render](/api/core/render) Renders the chart into a DOM element.

## Marks

- [rect](/api/marks/rect) Draws a rectangle for each data item.
- [circle](/api/marks/circle) Draws a circle for each data item.
- [ellipse](/api/marks/ellipse) Draws an ellipse for each data item.
- [line](/api/marks/line) Connects data points with a line.
- [area](/api/marks/area) Fills the area between data points.
- [blank](/api/marks/blank) Creates invisible positioning guides.
- [ref](/api/marks/ref) References another node by name.

## Operators

- [spread](/api/operators/spread) Lays out groups along an axis.
- [stack](/api/operators/stack) Stacks items edge-to-edge.
- [table](/api/operators/table) Groups data by two fields and lays out groups in a 2D grid.
- [scatter](/api/operators/scatter) Positions children by mean (or per-item) x/y.
- [group](/api/operators/group) Wraps each partition in a frame.
- [treemap](/api/operators/treemap) Tiling layout by weight (area).
- [layer](/api/operators/layer) Overlays children without offset.
- [derive](/api/operators/derive) Transforms data in the pipeline.
- [log](/api/operators/log) Logs data for debugging.

## Selection

- [select](/api/selection/select) Selects named layer nodes.

## Coordinates

- [polar](/api/coords/polar) Polar coordinate transform.
- [clock](/api/coords/clock) Clock-oriented polar coordinates.

## Color Scales

- [palette](#palette) Categorical color scale — maps field values to colors by index or explicit lookup.
- [gradient](#gradient) Continuous color scale — interpolates colors across a numeric range.

### palette

```ts
palette(values);
```

Creates a categorical color scale. Pass it to `chart(data, { color })` or `.render(el, { color })`.

| `values` type            | Behavior                         |
| ------------------------ | -------------------------------- |
| `string`                 | Named scheme: `"tableau10"`      |
| `string[]`               | Colors cycled by index           |
| `Record<string, string>` | Explicit field value → color map |

```ts
// Named scheme
chart(data, { color: palette("tableau10") })
  .flow(spread({ by: "category", dir: "x" }))
  .mark(rect({ h: "value", fill: "category" }))
  .render(container, { w: 500, h: 300 });

// Explicit array
chart(data, { color: palette(["#e15759", "#4e79a7", "#59a14f"]) });

// Key → color map
chart(data, { color: palette({ low: "#4e79a7", high: "#e15759" }) });
```

### gradient

```ts
gradient(stops);
```

Creates a continuous color scale. Colors are interpolated across the numeric range of the `fill` field.

| `stops` type | Behavior                                       |
| ------------ | ---------------------------------------------- |
| `string`     | Named scheme: `"viridis"`, `"blues"`, `"reds"` |
| `string[]`   | Custom color stops interpolated in LAB space   |

```ts
// Named scheme
chart(data, { color: gradient("viridis") })
  .flow(spread({ by: "category", dir: "x" }))
  .mark(rect({ h: "value", fill: "temperature" }))
  .render(container, { w: 500, h: 300 });

// Custom stops
chart(data, { color: gradient(["#f7fbff", "#08306b"]) });
```

**Built-in gradient schemes:** `"viridis"`, `"blues"`, `"reds"`
