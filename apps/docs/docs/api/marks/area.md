# area

Fills the area between data points (edge-to-edge). Typically used on data returned by [`select()`](/api/selection/select).

::: starfish

```js
const lakeTotals = Object.entries(_.groupBy(seafood, "lake")).map(
  ([lake, items]) => ({
    lake,
    count: items.reduce((sum, item) => sum + item.count, 0),
  })
);

gf.Layer([
  gf.Chart(lakeTotals)
    .flow(gf.spread("lake", { dir: "x", spacing: 64 }))
    .mark(gf.scaffold({ h: "count" }).name("points")),
  gf.Chart(gf.select("points"))
    .mark(gf.area({ opacity: 0.6 })),
]).render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
area({ stroke?, strokeWidth?, opacity?, mixBlendMode?, dir?, interpolation? })
```

## Parameters

| Option | Type | Description |
|--------|------|-------------|
| `stroke` | `string` | Stroke color |
| `strokeWidth` | `number` | Stroke width (default `0`) |
| `opacity` | `number` | Opacity (0–1) |
| `mixBlendMode` | `"normal" \| "multiply"` | Blend mode (default `"normal"`) |
| `dir` | `"x" \| "y"` | Direction axis (default `"x"`) |
| `interpolation` | `"linear" \| "bezier"` | Curve interpolation (default `"bezier"`) |

## Example

```ts
chart(select("bars"))
  .mark(area({ opacity: 0.3 }))
  .render(container, { w: 500, h: 300 });
```
