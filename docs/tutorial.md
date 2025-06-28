# Tutorial: From a Bar Chart to a Polar Ribbon

Welcome to GoFish! In this tutorial we'll start by constructing a standard bar chart and slowly
turn it into a polar ribbon chart. Along the way, we'll encounter the pieces that make up a GoFish
chart: shapes, graphical operators, scales, and coordinate transforms.

## The Dataset

The dataset we'll work with in this tutorial is counts of the number of fish caught in different
lakes.

```ts
type Seafood = {
  lake: "Lake A" | "Lake B" | "Lake C" | "Lake D" | "Lake E" | "Lake F";
  species: "Bass" | "Trout" | "Catfish" | "Perch" | "Salmon";
  count: number;
}[];

const seafood: Seafood = [
  {
    lake: "Lake A",
    species: "Bass",
    count: 23,
  },
  {
    lake: "Lake A",
    species: "Trout",
    count: 31,
  },
  {
    lake: "Lake A",
    species: "Catfish",
    count: 29,
  },
  ...
];
```

## Bar Chart

The first thing we'll do with this data is just compare the raw totals of fish caught in each of the
lakes. That's easy to do with a bar chart!

A bar chart is a horizontal stack of rectangles where the height of each bar represents some data.
We can translate this description directly to some Starfish code:

<!-- ```ts
starfish(
  { h: 500 },
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    rect(lake, { w: 32, h: sum("count") })
  )
);
``` -->

```ts
starfish(
  { h: 500 },
  stackX(_.groupBy(seafood, "lake"), { spacing: 8 }, (lake) =>
    rect(lake, { w: 32, h: d.count.sum() })
  )
);
```

```ts
starfish(
  { h: 500 },
  stackX(
    { spacing: 8 },
    _.groupBy(seafood, "lake").map((lake) =>
      rect(lake, { w: 32, h: d.count.sum() })
    )
  )
);
```

<!-- ```ts
starfish(
  stackX(
    { spacing: 8 },
    _(catchData)
      .groupBy("lake")
      .map((d) => rect({ w: 32, h: value(_(d).sumBy("count")) }))
      .value()
  )
);
``` -->

<!-- ```ts
starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    rect(lake.sumBy("count"), { w: 32, h: "$data" })
  )
);
``` -->

<!-- ```ts
stackX(
  { spacing: 8 },
  _(seafood)
    .groupBy("lake")
    .map((lake) => rect({ w: 32, h: value(_(lake).sumBy("count")) }))
);
``` -->

Let's break this down! Just looking at the outer structure of the code, we have

```ts
starfish(..., stackX(..., (lake) => rect(...)));
```

We use `starfish` to create a graphic, `stackX` to make a stack in the x direction, and a `rect` for
each lake to create the bars. Now let's take a closer look at the arguments of each of these
functions.

`starfish` takes a parameter, h, that specifies the height of the graphic should be 500 pixels. (In this
visualization, the width is inferred from the placement of the rectangles.)

`stackX` takes a dataset and a spacing option that denotes the spacing (in pixels) between the bars.
We use the lodash library to group the entries in the `seafood` dataset by lake. This yields a
nested array.

`rect`'s width is a constant 32 pixels, and its height is the sum of all the fish
caught in the lake. The `value` function tells Starfish that this count is a data value, not a
literal pixel value like 32, and so the system should scale it to fit the available space.

<!-- ---

```ts
starfish(
  { width, height },
  stackX(seafood, { spacing: 8, groupBy: "lake" }, (lake) =>
    rect({ w: 32, h: value(lake.sumBy("count")) })
  )
);
```

```ts
starfish(seafood, { width, height }, (seafood) =>
  stackX(seafood, { spacing: 8, groupBy: "lake" }, (lake) =>
    rect({ w: 32, h: value(lake.sumBy("count")) })
  )
);
```

```ts
starfish(seafood, { width, height }, (seafood) =>
  stackX(seafood.groupBy("lake"), { spacing: 8 }, (lake) =>
    rect({ w: 32, h: value(lake.sumBy("count")) })
  )
);
```

Here's what the code is doing at a high level.
`stackX` creates a horizontal stack of shapes. Each shape is defined by the callback, `(lake) =>
...`. In this case, we've specified that the shapes are `rect`s. The outer `starfish` function
renders the visualization.

Now let's look more closely at the parameters. We've grouped the `seafood` dataset by `"lake"` to create one shape per lake, and we've separated each
shape by 8 pixels using the `spacing: 8` option on `stackX`. Each `rect`'s width is 32 pixels.
Their heights are proportional to the total `count` of species in each lake. The `value` function
tells starfish that `lake.sumBy("count")` is a data value, not a raw pixel value, and so it should
be scaled. -->

<!-- > [!NOTE]
> To override the summarization behavior, you can replace `"count"` with `(lake) => ...`. The `lake`
> argument will give you the entire `lake` dataset. -->

<!-- ```ts
starfish(
  stackX(
    seafood.groupBy("lake").summarize({ count: sum("count") }),
    { spacing: 8 },
    rect({ w: 32, h: "count" })
  )
);
```

```ts
starfish(
  stackX(seafood.groupBy("lake"), { spacing: 8 }, (lake) =>
    rect({ w: 32, h: lake.sumBy("count") })
  )
);
```

```ts
starfish(
  stackX(seafood.groupBy("lake"), { spacing: 8 }, (lake) =>
    rect(lake, { w: 32, h: "count" })
  )
);
```

```ts
// this one isn't right b/c there should be one instance of `rect` for each entry in lake... right? idk actually
starfish(
  stackX(seafood.groupBy("lake"), { spacing: 8 }, (lake) =>
    rect(lake, { w: 32, h: (d) => d.sumBy("count") })
  )
);
``` -->

## Stacked Bar Chart

Now that we've seen the overall totals for each lake, we'd like to break the counts down by species.
A natural way to visualize this is with a stacked bar chart.

A stacked bar chart is like a regular bar chart, but each bar is made of a vertical stack of
rectangles instead of just a single rectangle. To modify our bar chart code to make it a stacked bar
chart, we can insert a `stackY` operator between the `stackX` and `rect` functions and modify the
rectangle's height encoding:

<!-- ```ts
starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, { w: 32, h: "count" })
    )
  )
);
``` -->

```ts
starfish(
  { h: 500 },
  stackX(_.groupBy(seafood, "lake"), { spacing: 8 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, { w: 32, h: d.count })
    )
  )
);
```

(Notice that we removed the `sumBy`, since there is now one rectangle per `species`.) Ok great! Now
we have a bar for each fish, but we have to remember the order the fish appear in stack. To
distinguish between the bars more easily, we can add a data-driven `fill` color:

```ts
starfish(
  { h: 500 },
  stackX(_.groupBy(seafood, "lake"), { spacing: 8 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, { w: 32, h: d.count, fill: d.species })
    )
  )
);
```

<!-- ### Accessor-Style

It's starting to get a bit verbose. We can use the accessor-style syntax instead.

```ts
starfish(
  { h: 500 },
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, { w: 32, h: "count", fill: "species" })
    )
  )
);
```

```ts
starfish(
  { h: 500 },
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, { w: 32, h: get("count"), fill: get("species") })
    )
  )
);
``` -->

<!-- ```ts
starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, { w: 32, h: field("count"), fill: field("species") })
    )
  )
);
``` -->

<!-- In fact, we've already been using this style for `stack`!

These two are functionally equivalent:

```ts
rect({ w: 32, h: value(species.count), fill: value(species.species) });
```

```ts
rect(species, { w: 32, h: "count", fill: "species" });
```

```ts
rect(species, { w: 32, h: get("count"), fill: get("species") });
```

```ts
rect(species, { w: 32, h: d.count, fill: d.species });
``` -->

## Grouped Bar Chart

```ts
starfish(
  { h: 500 },
  stackX(_.groupBy(seafood, "lake"), { spacing: 12 }, (lake) =>
    stackX(lake, { spacing: 1 }, (species) =>
      rect(species, { w: 8, h: d.count, fill: d.species })
    )
  )
);
```

<!-- ```ts
starfish(
  { h: 500 },
  stackX(
    { spacing: 12 },
    _.groupBy(seafood, "lake").map((lake) =>
      stackX(
        { spacing: 1 },
        lake.map((species) =>
          rect({ w: 8, h: value(species.count), fill: value(species.species) })
        )
      )
    )
  )
);
``` -->

<!-- ## Waffle Chart -->

<!-- ```ts
starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    stackY(
      _(lake)
        .flatMap((species) => Array(species.count).fill(species))
        .chunk(4),
      { spacing: 2, alignment: "start" },
      (fishChunk) =>
        stackX(fishChunk, { spacing: 2 }, (fish) =>
          rect(fish, { w: 8, h: 8, fill: "species" })
        )
    )
  )
);
``` -->

<!-- The code is starting to look a bit complicated! We can write a custom `waffle` function to
encapsulate the waffle layout. -->

<!-- ```ts
const waffle = (data, options) =>
  stackY(
    _(data).chunk(options.chunk),
    { spacing: 2, alignment: "start" },
    (chunk) =>
      stackX(chunk, { spacing: 2 }, (entry) =>
        rect(entry, { w: 8, h: 8, fill: options.fill })
      )
  );

starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    waffle(
      _(lake).flatMap((species) => Array(species.count).fill(species)),
      { chunk: 4, fill: "species" }
    )
  )
);
```

```ts
const waffle = (data, options, children) =>
  stackY(
    _(data).chunk(options.chunk),
    { spacing: 2, alignment: "start" },
    (chunk) => stackX(chunk, { spacing: 2 }, (entry) => children(entry))
  );

starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    waffle(
      _(lake).flatMap((species) => Array(species.count).fill(species)),
      { chunk: 4 },
      (entry) => rect(entry, { w: 8, h: 8, fill: "species" })
    )
  )
);
``` -->

<!-- ```ts
/* WRAP DOES NEWLINE/SPACING ALTERNATION... */
starfish(
  stackX(seafood, { spacing: 8, groupBy: "lake" }, (lake) =>
    wrapY(lake, { spacing: 2 }, (species) =>
      wrapY(species, { spacing: 2 }, (entry) =>
        rect(entry, { w: 8, h: 8, fill: "species" })
      )
    )
  )
);
``` -->

<!--
Notice how similar this is to our original bar chart code!

```ts
starfish(
  stackX(_(seafood).groupBy("lake"), { spacing: 8 }, (lake) =>
    rect(lake, { w: 32, h: "count" })
  )
);
``` -->

## Ribbon Chart

```ts
starfish(
  { h: 500 },
  stackX(_.groupBy(seafood, "lake"), { spacing: 64 }, (lake) =>
    stackY(lake, { spacing: 2 }, (species) =>
      rect(species, {
        id: [d.lake, d.species],
        w: 16,
        h: d.count,
        fill: d.species,
      })
    )
  ),
  group(_.groupBy(seafood, "species"), {}, (species) =>
    connectX(species, { opacity: 0.8 }, (lake) =>
      ref(lake, { id: [d.lake, d.species] })
    )
  )
);
```

## Polar Ribbon Chart

## Add Some Effects
