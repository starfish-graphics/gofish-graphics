# chart

Creates a `ChartBuilder`. This is the entry point for every GoFish chart.

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
chart(data, options?)
```

## Parameters

| Parameter       | Type                  | Description                                                                                                                                                  |
| --------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data`          | `T`                   | The dataset to visualize                                                                                                                                     |
| `options.w`     | `number`              | Width hint for the chart frame                                                                                                                               |
| `options.h`     | `number`              | Height hint for the chart frame                                                                                                                              |
| `options.coord` | `CoordinateTransform` | Coordinate transform (e.g. `polar()`)                                                                                                                        |
| `options.color` | `ColorConfig`         | Color scale applied to all marks in this chart. Use [`palette()`](/api/#palette) for categorical data or [`gradient()`](/api/#gradient) for continuous data. |

Returns a `ChartBuilder<T>` with [`.flow()`](/api/core/flow), [`.mark()`](/api/core/mark), and [`.render()`](/api/core/render) methods.

## Example

```ts
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(container, { w: 500, h: 300, axes: true });
```
