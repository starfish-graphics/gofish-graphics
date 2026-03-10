# layer

Overlays multiple children in the same coordinate space without any layout offset.

::: starfish

```js
gf.Layer([
  gf.rect({ w: 100, h: 80, fill: gf.color.blue[3] }),
  gf.ellipse({ w: 60, h: 60, fill: gf.color.red[3] }),
]).render(root, { w: 200, h: 150 });
```

:::

Both shapes occupy the same space. The ellipse is drawn on top of the rectangle because it appears second in the array.

## Signature

```ts
Layer(options?, [child1, child2, ...])
```

## Parameters

| Option              | Type                  | Description                         |
| ------------------- | --------------------- | ----------------------------------- |
| `coord`             | `CoordinateTransform` | Coordinate transform for this layer |
| `w`                 | `number`              | Override width                      |
| `h`                 | `number`              | Override height                     |
| `transform.scale.x` | `number`              | Scale factor for x axis             |
| `transform.scale.y` | `number`              | Scale factor for y axis             |
