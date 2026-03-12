# render

Renders the chart into a DOM element.

## Signature

```ts
.render(container, options)
```

## Parameters

| Parameter      | Type          | Description                             |
| -------------- | ------------- | --------------------------------------- |
| `container`    | `HTMLElement` | The DOM element to render into          |
| `options.w`    | `number`      | Width in pixels                         |
| `options.h`    | `number`      | Height in pixels                        |
| `options.axes` | `boolean`     | Auto-generate axes, labels, and legends |

## Example

```ts
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(container, { w: 500, h: 300, axes: true });
```
