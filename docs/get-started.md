# Get Started!

:::starfish https://myurl.com

```ts
const data = [
  {
    Year: 2017,
    Quarter: "Q1",
    "% Change": 2.3,
  },
  {
    Year: 2017,
    Quarter: "Q2",
    "% Change": 1.7,
  },
  {
    Year: 2017,
    Quarter: "Q3",
    "% Change": 2.9,
  },
  {
    Year: 2017,
    Quarter: "Q4",
    "% Change": 3.9,
  },
  {
    Year: 2018,
    Quarter: "Q1",
    "% Change": 3.8,
  },
  {
    Year: 2018,
    Quarter: "Q2",
    "% Change": 2.7,
  },
  {
    Year: 2018,
    Quarter: "Q3",
    "% Change": 2.1,
  },
  {
    Year: 2018,
    Quarter: "Q4",
    "% Change": 1.3,
  },
  {
    Year: 2019,
    Quarter: "Q1",
    "% Change": 2.9,
  },
  {
    Year: 2019,
    Quarter: "Q2",
    "% Change": 1.5,
  },
  {
    Year: 2019,
    Quarter: "Q3",
    "% Change": 2.6,
  },
  {
    Year: 2019,
    Quarter: "Q4",
    "% Change": 2.4,
  },
  // {
  //   Year: 2020,
  //   Quarter: "Q1",
  //   "% Change": -5,
  // },
  // {
  //   Year: 2020,
  //   Quarter: "Q2",
  //   "% Change": -31.4,
  // },
  {
    Year: 2020,
    Quarter: "Q3",
    "% Change": 33.4,
  },
  {
    Year: 2020,
    Quarter: "Q4",
    "% Change": 4,
  },
];

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.rect({ x: 0, y: 0, w: 20, h: 300, fill: "#84BC66" })
);
```

:::

:::starfish https://myurl.com

```ts
const data = [
  {
    Year: 2017,
    Quarter: "Q1",
    "% Change": 2.3,
  },
  {
    Year: 2017,
    Quarter: "Q2",
    "% Change": 1.7,
  },
  {
    Year: 2017,
    Quarter: "Q3",
    "% Change": 2.9,
  },
  {
    Year: 2017,
    Quarter: "Q4",
    "% Change": 3.9,
  },
  {
    Year: 2018,
    Quarter: "Q1",
    "% Change": 3.8,
  },
  {
    Year: 2018,
    Quarter: "Q2",
    "% Change": 2.7,
  },
  {
    Year: 2018,
    Quarter: "Q3",
    "% Change": 2.1,
  },
  {
    Year: 2018,
    Quarter: "Q4",
    "% Change": 1.3,
  },
  {
    Year: 2019,
    Quarter: "Q1",
    "% Change": 2.9,
  },
  {
    Year: 2019,
    Quarter: "Q2",
    "% Change": 1.5,
  },
  {
    Year: 2019,
    Quarter: "Q3",
    "% Change": 2.6,
  },
  {
    Year: 2019,
    Quarter: "Q4",
    "% Change": 2.4,
  },
  {
    Year: 2020,
    Quarter: "Q1",
    "% Change": 5,
  },
  {
    Year: 2020,
    Quarter: "Q2",
    "% Change": 31.4,
  },
  {
    Year: 2020,
    Quarter: "Q3",
    "% Change": 33.4,
  },
  {
    Year: 2020,
    Quarter: "Q4",
    "% Change": 4,
  },
];

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackX(
    { spacing: 1, alignment: "end", sharedScale: true },
    _(data)
      .groupBy("Quarter")
      .map((d) => gf.rect({ w: 20, h: 300, fill: "#84BC66" }))
      .value()
  )
);
```

:::

```ts
stackX(_(data).groupBy("Quarter"), { spacing: 1 }, (d) =>
  rect({ w: 20, h: 300, fill: "#84BC66" })
).render(root);
```

:::starfish https://myurl.com

```ts
const data = [
  {
    Year: 2017,
    Quarter: "Q1",
    "% Change": 2.3,
  },
  {
    Year: 2017,
    Quarter: "Q2",
    "% Change": 1.7,
  },
  {
    Year: 2017,
    Quarter: "Q3",
    "% Change": 2.9,
  },
  {
    Year: 2017,
    Quarter: "Q4",
    "% Change": 3.9,
  },
  {
    Year: 2018,
    Quarter: "Q1",
    "% Change": 3.8,
  },
  {
    Year: 2018,
    Quarter: "Q2",
    "% Change": 2.7,
  },
  {
    Year: 2018,
    Quarter: "Q3",
    "% Change": 2.1,
  },
  {
    Year: 2018,
    Quarter: "Q4",
    "% Change": 1.3,
  },
  {
    Year: 2019,
    Quarter: "Q1",
    "% Change": 2.9,
  },
  {
    Year: 2019,
    Quarter: "Q2",
    "% Change": 1.5,
  },
  {
    Year: 2019,
    Quarter: "Q3",
    "% Change": 2.6,
  },
  {
    Year: 2019,
    Quarter: "Q4",
    "% Change": 2.4,
  },
  // {
  //   Year: 2020,
  //   Quarter: "Q1",
  //   "% Change": -5,
  // },
  // {
  //   Year: 2020,
  //   Quarter: "Q2",
  //   "% Change": -31.4,
  // },
  {
    Year: 2020,
    Quarter: "Q3",
    "% Change": 33.4,
  },
  {
    Year: 2020,
    Quarter: "Q4",
    "% Change": 4,
  },
];

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackX(
    { spacing: 16, alignment: "end", sharedScale: true },
    _(data)
      .groupBy("Year")
      .map((d) =>
        gf.stackX(
          { spacing: 1, alignment: "end" },
          _(d)
            .groupBy("Quarter")
            .map((d) =>
              gf.rect({
                w: 20,
                h: /* value(d["% Change"], "value") */ d["% Change"],
              })
            )
            .value()
        )
      )
      .value()
  )
);
```

:::

```ts
stackX(_(data).groupBy("Year"), { spacing: 16 }, (d) =>
  stackX(_(d).groupBy("Quarter"), { spacing: 1 }, (d) =>
    rect({ w: 20, h: 300, fill: "#84BC66" })
  )
).render(root);
```

```ts
stackX(_(data).groupBy("Year"), { spacing: 16, h: 300 }, (d) =>
  stackX(_(d).groupBy("Quarter"), { spacing: 1 }, (d) =>
    rect({ w: 20, h: v["% Change"], fill: "#84BC66" })
  )
).render(root);
```

```ts
stackX(_(data).groupBy("Year"), { spacing: 16, h: 300 }, (d) =>
  stackX(_(d).groupBy("Quarter"), { spacing: 1 }, (d) =>
    rect({ w: 20, h: v(d["% Change"]), fill: "#84BC66" })
  )
).render(root);
```

Extreme version

```ts
stackX(_(data).groupBy("Year"), { spacing: 16, h: 300 }, () =>
  stackX(v.groupBy("Quarter"), { spacing: 1 }, () =>
    rect({ w: 20, h: v["% Change"], fill: "#84BC66" })
  )
).render(root);
```

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

```ts
gofish(
  root,
  { width: size.width, height: size.height },
  stackX(_(caughtFish).groupBy("lake"), { spacing: 4 }, (lake) =>
    rect({ w: 30, h: v(lake).sumBy("value") })
  )
);
```

```ts
gofish(
  root,
  { width: size.width, height: size.height },
  stackX(alphabet, { spacing: 4 }, (letter) =>
    rect({ w: 30, h: v(letter.frequency) })
  )
);
```

```ts
stackX(alphabet, { spacing: 4 }, (letter) =>
  rect({ w: 30, h: v(letter.frequency) })
).render(root);
```

```ts
gofish(
  root,
  stackX(alphabet, { spacing: 4 }, (letter) =>
    rect({ w: 30, h: v(letter.frequency) })
  )
);
```

```ts
gf.stackX(alphabet, { spacing: 4 }, (letter) =>
  gf.rect(letter, { w: 30, h: v.frequency })
).render(root);
```

```ts
gf.stackX(alphabet, { spacing: 4 }, (letter) =>
  gf.rect({ w: 30, h: v.frequency })
).render(root);
```

```bash
npm install starfish-graphics
```

## What's Next?

- Tutorial
- Examples
- API Reference
<!-- - Guides -->
