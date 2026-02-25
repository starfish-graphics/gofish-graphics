# line

Connects data points center-to-center with a line. Typically used on data returned by [`select()`](/api/selection/select).

::: starfish

```js
const locations = Object.entries(lakeLocations).map(
  ([lake, { x, y }]) => ({ lake, x, y })
);

gf.Layer([
  gf.Chart(locations)
    .flow(gf.scatter("lake", { x: "x", y: "y" }))
    .mark(gf.scaffold().name("points")),
  gf.Chart(gf.select("points"))
    .mark(gf.line({ stroke: "steelblue", strokeWidth: 2 })),
]).render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
line({ stroke?, strokeWidth?, opacity?, interpolation? })
```

## Parameters

| Option | Type | Description |
|--------|------|-------------|
| `stroke` | `string` | Line color |
| `strokeWidth` | `number` | Line thickness (default `1`) |
| `opacity` | `number` | Opacity (0–1) |
| `interpolation` | `"linear" \| "bezier"` | Line interpolation (default `"linear"`) |

## Example

```ts
// First chart: bar chart with named layer
chart(data)
  .flow(spread("x", { dir: "x" }))
  .mark(rect({ h: "y" }).name("bars"))
  .render(container, { w: 500, h: 300 });

// Second chart: line over the same bars
chart(select("bars"))
  .mark(line({ stroke: "steelblue", strokeWidth: 2 }))
  .render(container, { w: 500, h: 300 });
```
