# Forward Syntax Examples

## Basic

**bar chart**

```ts
chart(seafood)
  .flow(spread("lake", { dir: "x" }))
  .mark(rect({ h: "count" }));
```

_horizontal bar chart_

```ts
chart(seafood)
  .flow(spread("lake", { dir: "y" }))
  .mark(rect({ w: "count" }));
```

**scatter plot**

```ts
chart(seafood)
  .flow(scatter({ x: "lakeLocX", y: "lakeLocY" }))
  .mark(circle());
```

**line chart**

```ts
layer([
  chart(seafood)
    .flow(scatter({ x: "lakeLocX" }))
    .mark(scaffold())
    .as("points"),
  chart(select("points")).flow(connect()).mark(line()),
]);
```

```ts
chart(seafood)
  .flow(scatter("lake", { x: "lakeLocX" }), connect())
  .mark(line());
```

```ts
chart(seafood)
  .flow(scatter("lake", { x: "lakeLocX" }))
  .mark(scaffold())
  .layer(connect(), line());
```

```ts
chart(seafood)
  .flow(scatter("lake", { x: "lakeLocX" }))
  .mark(scaffold())
  .layer(chart().flow(connect()).mark(line()));
```

**area chart**

```ts
layer([
  chart(seafood)
    .flow(scatter({ x: "lakeLocX" }))
    .mark(scaffold({ h: "count" }))
    .as("points"),
  chart(select("points")).mark(connect()),
]);
```

**pie chart**

```ts
chart(seafood, { coord: clock() })
  .flow(stack("species", { dir: "theta" }))
  .mark(rect({ "theta-size": "count", fill: "species" }));
```

## Still basic

**stacked bar chart**

```ts
chart(seafood)
  .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
  .mark(rect({ h: "count", fill: "species" }));
```

**grouped bar chart**

```ts
chart(seafood)
  .flow(spread("lake", { dir: "x" }), stack("species", { dir: "x" }))
  .mark(rect({ h: "count", fill: "species" }));
```

**stacked area chart**

```ts
layer([
  chart(seafood)
    .flow(scatter({ x: "lakeLocX" }), stack("species", { dir: "y" }))
    .mark(scaffold({ h: "count" }))
    .as("points"),
  chart(select("points")).mark(foreach("species"), connect()),
]);
```

**donut chart**

```ts
chart(seafood, { coord: clock() })
  .flow(stack("species", { dir: "theta", r: 50, "r-size": 50 }))
  .mark(rect({ "theta-size": "count", fill: "species" }));
```

**rose chart**

```ts
// TODO: the R direction should be sqrt'd I guess?
chart(nightingale, { coord: clock() })
  .flow(stack("Month", { dir: "theta" }), stack("Type", { dir: "r" }))
  .mark(rect({ "r-size": "Death", fill: "Type" }));
```

## Slightly more complex

**streamgraph**

```ts
layer([
  chart(seafood)
    .flow(
      scatter({ x: "lakeLocX", alignment: "middle" }),
      stack("species", { dir: "y" })
    )
    .mark(scaffold({ h: "count" }))
    .as("points"),
  chart(select("points")).mark(foreach("species"), connect()),
]);
```

**mosaic**

```ts
chart(cars)
  .flow(
    spread("origin", { dir: "x", spacing: 4 }),
    stack("cylinders", { w: "count" }),
    // TODO: not really sure if this is in the right spot...
    // however I think this is also where something like sorting will go, too...
    derive(norm("count"))
  )
  .mark(rect({ h: "count", fill: "origin" }));
```

**waffle**

```ts
chart(seafood)
  .flow(
    spread("lake", { spacing: 8, dir: "x" }),
    derive((d) => d.repeat("count").chunk(5)),
    spread({ spacing: 2, dir: "y" }),
    spread({ spacing: 2, dir: "x" })
  )
  .mark(rect({ w: 8, h: 8, fill: "species" }));
```

**ribbon**

```ts
layer([
  chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64 }),
      derive(sortBy("count")),
      stack("species", { dir: "y" })
    )
    .mark(rect({ w: 16, h: "count", fill: "species" }))
    .as("bars"),
  // an array of data with key and mark ref
  chart(select("bars")) // pair up data values?
    // array is now grouped by species with one mark produced for each one
    .flow(foreach("species"))
    // species array is passed as children(?) to connect
    .mark(connect({ dir: "x", opacity: 0.8 })),
]);
```

**polar ribbon**

```ts
plot({ coord: clock() }).mark([
  plot(seafood)
    .flow(
      spread("lake", { dir: "theta", r: 50, spacing: 60, mode: "center" }),
      derive(sortBy("count")),
      stack("species", { dir: "y" })
    )
    .mark(rect({ w: 16, h: "count", fill: "species" }))
    .as("bars"),
  // an array of data with key and mark ref
  plot(select("bars"))
    // array is now grouped by species with one mark produced for each one
    .flow(foreach("species"))
    // species array is passed as children(?) to connect
    .mark(connect({ dir: "x", opacity: 0.8 })),
]);
```

**ridgeline**

```ts
const area = createMark((data, { x, y }) =>
  layer([
    chart(data)
      .flow(scatter({ x }))
      .mark(scaffold({ h: y }))
      .as("points"),
    chart(select("points")).mark(connect()),
  ])
);

chart(seafood)
  .flow(spread("species", { dir: "y", spacing: -16 }))
  .mark(area({ x: "lakeLocX", y: "count" }));
```

**layered area**

```ts
const area = createMark((data, { x, y }) =>
  layer([
    chart(data)
      .flow(scatter({ x }))
      .mark(scaffold({ h: y }))
      .as("points"),
    chart(select("points")).mark(connect()),
  ])
);

chart(seafood)
  .flow(foreach("species"))
  .mark(area({ x: "lakeLocX", y: "count" }));
```

**scatter pie**

<!--
flow(
  seafood,
  scatter({ x: "lakeLocX", y: "lakeLocY" }),
  coord(clock()),
  stack(category, { dir: "theta" }),
  rect({ "theta-size": value, fill: category })
);
 -->

```ts
const pie = createMark((data, { category, value }) =>
  chart(data, { coord: clock() })
    .flow(stack(category, { dir: "theta" }))
    .mark(rect({ "theta-size": value, fill: category }))
);

chart(seafood)
  .flow(scatter({ x: "lakeLocX", y: "lakeLocY" }))
  .mark(pie({ category: "species", value: "count" }));
```

**connected scatter plot**

```ts
layer([
  chart(seafood)
    .flow(scatter({ x: "lakeLocX" }))
    .mark(circle())
    .as("points"),
  chart(select("points")).mark(line(/* { z: -1 } */)).zIndex(-1),
]);
```

**flower chart** (doable)
TODO

**balloon** (doable)
TODO

## Even more complicated

**bump chart**

```ts
layer([
  chart(newCarColors)
    .flow(
      scatter({ x: "Year" }),
      derive(sortBy("Rank")),
      spread("Color", { dir: "y" })
    )
    .mark(circle({ fill: (d) => d.Color }))
    .as("points"),
  chart(select("points"), foreach("Color"))
    .mark(line(/* { z: -1 } */))
    .zIndex(-1),
]);
```

**box and whisker**

<!-- TODO: this is maybe too complicated to ship right away... -->

```ts
const boxAndWhisker = createMark((data, { q0, q25, q50, q75, q100, fill }) => [
  segment({ y: q0, stroke: "gray + 1px" }).as("min"),
  segment({ y: q100, stroke: "gray + 1px" }).as("max"),
  connect({ from: select("min"), to: select("max") }),
  segment({ "y-min": q1, "y-max": q3, fill }),
  segment({ y: q50, stroke: "white + 1px" }),
]);

plot(genderPayGap)
  .flow(spread("Pay Grade", { dir: "x" }), stack("Gender", { dir: "x" }))
  .mark(
    boxAndWhisker({
      q0: "Min",
      q25: "25-Percentile",
      q50: "Median",
      q75: "75-Percentile",
      q100: "Max",
      fill: "Gender",
    })
  );
```

**violin plot**

```ts
import { density1d } from "fast-kde";

/* TODO: this is really a variation of area... */
const violin = createMark((data, { x, fill }) => {
  const densityData = density1d(
    data.map((p) => p[x]).filter((w) => w !== null)
  );

  layer([
    chart(densityData)
      .flow(scatter({ y: "y", alignment: "middle" }))
      .mark(scaffold({ w: "x", fill }))
      .as("points"),
    chart(select("points")).mark(connect()),
  ]);
});

plot(penguins)
  .flow(spread("Species"))
  .mark(violin({ x: "Body Mass (g)", fill: "Species" }));
```

**stringline**
TODO (this might be relatively easy compared to some of the others...)

**icicle chart**
TODO

**sankey tree**
TODO

**nested waffle**
TODO

**nested mosaic**
TODO
