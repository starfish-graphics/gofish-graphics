# spread

Groups data by `field` and lays out groups along an axis. The primary layout operator.

::: starfish

```js
gf.Chart(seafood)
  .flow(gf.spread("lake", { dir: "x" }))
  .mark(gf.rect({ h: "count" }))
  .render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
spread(field, { dir, spacing = 8, alignment = "start", sharedScale?, reverse?, w?, h? })
spread({ dir, spacing = 8, alignment = "start", ... })  // no grouping
```

## Parameters

| Option        | Type                           | Description                               |
| ------------- | ------------------------------ | ----------------------------------------- |
| `field`       | `string`                       | Field to group by before laying out       |
| `dir`         | `"x" \| "y"`                   | **Required.** Layout direction            |
| `spacing`     | `number`                       | Gap between groups                        |
| `alignment`   | `"start" \| "middle" \| "end"` | Alignment within each slot                |
| `sharedScale` | `boolean`                      | Share scale across all groups             |
| `reverse`     | `boolean`                      | Reverse group order                       |
| `w`           | `number \| string`             | Fixed width or field for width encoding   |
| `h`           | `number \| string`             | Fixed height or field for height encoding |

## Examples

```ts
// Horizontal bar chart: one bar per "letter"
.flow(spread("letter", { dir: "x" }))

// Vertical layout with fixed width per group
.flow(spread("category", { dir: "y", w: 40 }))
```
