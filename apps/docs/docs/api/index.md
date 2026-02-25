---
pageClass: api-page
---

# API Reference

The GoFish API for creating charts and visualizations.

By combining operators and marks, you can create complex and automatic chart layouts.

## How To

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
- [scaffold](/api/marks/scaffold) Creates invisible positioning guides.
- [ref](/api/marks/ref) References another node by name.

## Operators

- [spread](/api/operators/spread) Lays out groups along an axis.
- [stack](/api/operators/stack) Stacks items edge-to-edge.
- [scatter](/api/operators/scatter) Positions groups by mean x/y.
- [layer](/api/operators/layer) Overlays children without offset.
- [derive](/api/operators/derive) Transforms data in the pipeline.
- [log](/api/operators/log) Logs data for debugging.

## Selection

- [select](/api/selection/select) Selects named layer nodes.

## Coordinates

- [polar](/api/coords/polar) Polar coordinate transform.
- [clock](/api/coords/clock) Clock-oriented polar coordinates.
