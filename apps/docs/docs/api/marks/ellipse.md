# ellipse

Draws an ellipse. Unlike `circle`, allows independent control of width and height.

::: starfish

```js
gf.Ellipse({ w: 100, h: 60, fill: "mediumseagreen" })
  .render(root, { w: 150, h: 100 });
```

:::

## Signature

```ts
Ellipse({ w?, h?, fill?, stroke?, strokeWidth? })
```

## Parameters

| Option | Type | Description |
|--------|------|-------------|
| `w` | `number \| string` | Width — number for fixed, field name to encode data |
| `h` | `number \| string` | Height — number for fixed, field name to encode data |
| `fill` | `string` | Fill color or field name for color encoding |
| `stroke` | `string` | Stroke color (defaults to `fill`) |
| `strokeWidth` | `number` | Stroke width (default `0`) |

## Examples

```ts
// Fixed size ellipse
Ellipse({ w: 80, h: 40, fill: "coral" })

// Ellipse with stroke
Ellipse({ w: 60, h: 30, fill: "white", stroke: "black", strokeWidth: 2 })

// Data-driven dimensions
Ellipse({ w: "width", h: "height", fill: "category" })
```

## See Also

- [circle](/api/marks/circle) — Equal width and height (circular shape)
- [rect](/api/marks/rect) — Rectangular shape
