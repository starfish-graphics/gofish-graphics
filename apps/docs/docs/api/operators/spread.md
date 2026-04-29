# spread

Partitions data by the `by` field and lays out one child per partition along an axis. The primary layout operator.

::: starfish

```js
gf.Chart(seafood)
  .flow(gf.spread({ by: "lake", dir: "x" }))
  .mark(gf.rect({ h: "count" }))
  .render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
// Operator form (inside .flow):
spread({ by?, dir, spacing?, alignment?, ... })

// Combinator form (apply n marks to one datum):
spread({ dir, ... }, [m1, m2, ...])
```

## Parameters

| Option        | Type                                         | Default      | Description                                                    |
| ------------- | -------------------------------------------- | ------------ | -------------------------------------------------------------- |
| `by`          | `string`                                     | —            | Field to partition by; omit for per-item spread                |
| `dir`         | `"x" \| "y"`                                 | —            | **Required.** Layout axis                                      |
| `spacing`     | `number`                                     | `8`          | Gap between children                                           |
| `alignment`   | `"start" \| "middle" \| "end" \| "baseline"` | `"baseline"` | Alignment along the off-axis                                   |
| `mode`        | `"edge" \| "center"`                         | `"edge"`     | Whether `spacing` is measured edge-to-edge or center-to-center |
| `reverse`     | `boolean`                                    | `false`      | Reverse children order along `dir`                             |
| `sharedScale` | `boolean`                                    | `false`      | Share scale across all children                                |
| `w`, `h`      | `number \| string`                           | —            | Fixed dimension, or field name to encode size from data        |

## Examples

```ts
// Horizontal bar chart: one bar per "letter"
.flow(spread({ by: "letter", dir: "x" }))

// Vertical layout with fixed width per group
.flow(spread({ by: "category", dir: "y", w: 40 }))

// Combinator form: apply different marks to the same datum
spread({ dir: "x" }, [rect({ h: "v" }), text({ text: "n" })])
```
