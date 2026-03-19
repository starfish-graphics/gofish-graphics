# stack

Like [`spread`](/api/operators/spread) but with zero spacing — items stack edge-to-edge. Used for stacked bar charts.

::: starfish

```js
gf.Chart(seafood)
  .flow(gf.spread("lake", { dir: "x" }), gf.stack("species", { dir: "y" }))
  .mark(gf.rect({ h: "count", fill: "species" }))
  .render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
stack(field, { dir, alignment = "start", w?, h? })
```

## Parameters

| Option      | Type                           | Description                       |
| ----------- | ------------------------------ | --------------------------------- |
| `field`     | `string`                       | Field to group by before stacking |
| `dir`       | `"x" \| "y"`                   | **Required.** Stack direction     |
| `alignment` | `"start" \| "middle" \| "end"` | Alignment within each slot        |
| `w`         | `number \| string`             | Width or field                    |
| `h`         | `number \| string`             | Height or field                   |

## Example

```ts
// Stacked bar chart grouped by "site", stacked by "variety"
.flow(
  spread("variety", { dir: "x" }),
  stack("site", { dir: "y" })
)
```
