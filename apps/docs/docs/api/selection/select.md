# select

Creates a lazy selector that resolves to the nodes registered by a named mark (via `.name()`). Pass it as the data argument to a second [`chart()`](/api/core/chart) call to create overlays.

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
    .flow(gf.spread("lake", { dir: "x" }))
    .mark(gf.rect({ h: "count" }).name("bars")),
  gf.Chart(gf.select("bars"))
    .mark(gf.line({ stroke: "coral", strokeWidth: 2 })),
]).render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
select(layerName: string)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `layerName` | `string` | The name of the layer to select (registered via `.name()` on a mark) |

## Example

```ts
// Step 1: name the mark
chart(data)
  .flow(spread("x", { dir: "x" }))
  .mark(rect({ h: "y" }).name("bars"))
  .render(container, opts);

// Step 2: select those nodes as data for a new chart
chart(select("bars"))
  .mark(line({ strokeWidth: 2 }))
  .render(container, opts);
```
