# mark

Sets the visual mark used to render each data group.

## Signature

```ts
.mark(mark)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `mark` | `Mark` | The mark to use for rendering (e.g. `rect()`, `line()`, `area()`) |

## Example

```ts
chart(data)
  .flow(spread("category", { dir: "x" }))
  .mark(rect({ h: "value" }))
```

Marks can also call `.name("layerName")` to register their output nodes for later use with [`select()`](/api/selection/select):

```ts
.mark(rect({ h: "value" }).name("bars"))
```
