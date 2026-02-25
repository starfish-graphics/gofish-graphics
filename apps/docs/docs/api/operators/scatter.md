# scatter

Groups data by `field` and positions each group at the mean `x`/`y` of its members.

::: starfish

```js
const locations = Object.entries(lakeLocations).map(
  ([lake, { x, y }]) => ({ lake, x, y })
);

gf.Chart(locations)
  .flow(gf.scatter("lake", { x: "x", y: "y" }))
  .mark(gf.circle({ r: 8 }))
  .render(root, { w: 400, h: 250, axes: true });
```

:::

## Signature

```ts
scatter(field, { x, y, debug? })
```

## Parameters

| Option | Type | Description |
|--------|------|-------------|
| `field` | `string` | Field to group by |
| `x` | `string` | Field to use for horizontal position |
| `y` | `string` | Field to use for vertical position |
| `debug` | `boolean` | Log group positions to console |

## Example

```ts
.flow(scatter("species", { x: "bill_length", y: "flipper_length" }))
.mark(rect({ w: 8, h: 8, rx: 4 }))
```
