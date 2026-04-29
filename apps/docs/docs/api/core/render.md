# render

Renders the chart into a DOM element.

## Signature

```ts
.render(container, options)
```

## Parameters

| Parameter      | Type                                    | Description                                                                             |
| -------------- | --------------------------------------- | --------------------------------------------------------------------------------------- |
| `container`    | `HTMLElement`                           | The DOM element to render into                                                          |
| `options.w`    | `number`                                | Width in pixels                                                                         |
| `options.h`    | `number`                                | Height in pixels                                                                        |
| `options.axes` | `boolean \| { x: boolean; y: boolean }` | Auto-generate axes, labels, and legends. Use an object to toggle x/y axes individually. |

## Example

```ts
chart(data)
  .flow(spread({ by: "category", dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(container, { w: 500, h: 300, axes: true });
```

```ts
chart(data)
  .flow(spread({ by: "category", dir: "x" }))
  .mark(rect({ h: "value" }))
  .render(container, { w: 500, h: 300, axes: { x: true, y: false } });
```
