# Get Started!

:::starfish https://myurl.com

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

gofish(
  root,
  { width: size.width, height: size.height },
  stackX(
    { spacing: 4, alignment: "end", sharedScale: true },
    data.map((d) => rect({ w: 30, h: value(d.b, "value") }))
  )
);
```

:::

```bash
npm install starfish-graphics
```

## What's Next?

- Tutorial
- Examples
- API Reference
<!-- - Guides -->
