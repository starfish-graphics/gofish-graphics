# stack

Like [`spread`](/api/operators/spread) but with zero spacing — items stack edge-to-edge. Used for stacked bar charts.

::: starfish

```js
gf.Chart(seafood)
  .flow(
    gf.spread({ by: "lake", dir: "x" }),
    gf.stack({ by: "species", dir: "y" })
  )
  .mark(gf.rect({ h: "count", fill: "species" }))
  .render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
// Operator form:
stack({ by?, dir, alignment?, ... })

// Combinator form:
stack({ dir, ... }, [m1, m2, ...])
```

## Parameters

Same as [`spread`](/api/operators/spread) without `spacing` (which is forced to 0).

## Example

```ts
// Stacked bar chart grouped by "site", stacked by "variety"
.flow(
  spread({ by: "variety", dir: "x" }),
  stack({ by: "site", dir: "y" })
)
```
