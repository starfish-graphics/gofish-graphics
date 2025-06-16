# Bar Chart

::: starfish

```ts
const data = [
  { a: "A", b: 28 },
  { a: "B", b: 55 },
  { a: "C", b: 43 },
  { a: "D", b: 91 },
  { a: "E", b: 81 },
  { a: "F", b: 53 },
  { a: "G", b: 19 },
  { a: "H", b: 87 },
  { a: "I", b: 52 },
];

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackX(
    { spacing: 4, alignment: "end", sharedScale: true },
    data.map((d) => gf.rect({ w: 30, h: gf.value(d.b, "value") }))
  )
);
```

:::
