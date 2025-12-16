# Examples

All examples will end in

```ts
.render(container, {
  w: 500,
  h: 300,
  axes: true,
});
```

so we can omit it from the examples.

## Bar Charts

### Vertical Bar Chart

```ts
barChart(data, { x: "x", y: "y" });
```

desugars to (no complex inference so readable w/o type annotations):

```ts
barChart(data, { x: "x", y: "y", orientation: "y" });
```

### Horizontal Bar Chart

```ts
barChart(data, { x: "x", y: "y", orientation: "x" });
```

### Stacked Bar Chart

```ts
barChart(data, { x: "x", y: "y" }).stack("group");
```

### Grouped Bar Chart

```ts
barChart(data, { x: "x", y: "y" }).group("group");
```

## Line Charts

```ts
lineChart(data, { x: "x", y: "y" });
```

## Scatter Plots

```ts
scatterChart(data, { x: "x", y: "y" });
```

## Area Charts

```ts
areaChartY(data, { x: "x", y: "y" });
```

## Stacked Area Charts

```ts
areaChart(data, { x: "x", y: "y" }).stack("group");
```

## Streamgraph

```ts
areaChart(data, { x: "x", y: "y", alignment: "middle" }).stack("group");
```

## Ribbon Charts

```ts
ribbonChart(data, { x: "x", y: "y" }).stack("group");
```

## Pie Charts

```ts
pieChart(data, { theta: "category", size: "value" });
```

## Rose Charts

```ts
roseChart(data, { theta: "category", r: "value" }).stack("group");
```
