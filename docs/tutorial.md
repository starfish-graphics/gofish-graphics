# Tutorial: From a Rectangle to a Polar Ribbon

Welcome to GoFish! In this tutorial we'll start with a rectangle and gradually
turn it into a polar ribbon chart. Along the way, we'll encounter the pieces that make up a GoFish
chart: shapes, graphical operators, scales, and coordinate transforms.

::: starfish example:polar-ribbon-chart hidden

To start, duplicate this tab to follow along in the live editor!

<!-- ```ts index.ts
// prettier-ignore
import { StackX, StackY, ConnectX, Rect, Ref, For, v, color, Frame, Polar, groupBy, sumBy, orderBy } from "gofish-graphics";
import { seafood } from "./dataset";

const root = document.getElementById("app");

Rect({ x: 0, y: 0, w: 32, h: 300, fill: color.green[5] }).render(root, {
  w: 500,
  h: 300,
});
``` -->

::: starfish-live {template=vanilla-ts rtl lightTheme=aquaBlue darkTheme=atomDark previewHeight=400 coderHeight=768}

```ts index.ts
import { rect, color, orderBy, guide } from "gofish-graphics";
import { seafood } from "./dataset";

const root = document.getElementById("app");

rect({ x: 0, y: 0, w: 32, h: 300, fill: color.green[5] }).render(root, {
  w: 500,
  h: 300,
});
```

```ts dataset.ts
export type Lakes =
  | "Lake A"
  | "Lake B"
  | "Lake C"
  | "Lake D"
  | "Lake E"
  | "Lake F";

export type SeafoodData = {
  lake: Lakes;
  species: "Bass" | "Trout" | "Catfish" | "Perch" | "Salmon";
  count: number;
};

export const lakeLocations: Record<Lakes, { x: number; y: number }> = {
  "Lake A": { x: 5.26, y: 22.64 },
  "Lake B": { x: 30.87, y: 120.75 },
  "Lake C": { x: 50.01, y: 60.94 },
  "Lake D": { x: 115.13, y: 94.16 },
  "Lake E": { x: 133.05, y: 50.44 },
  "Lake F": { x: 85.99, y: 172.78 },
};

export const seafood: SeafoodData[] = [
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
  {
    lake: "Lake A",
    species: "Perch",
    count: 12,
  },
  {
    lake: "Lake A",
    species: "Salmon",
    count: 8,
  },
  {
    lake: "Lake B",
    species: "Bass",
    count: 25,
  },
  {
    lake: "Lake B",
    species: "Trout",
    count: 34,
  },
  {
    lake: "Lake B",
    species: "Catfish",
    count: 41,
  },
  {
    lake: "Lake B",
    species: "Perch",
    count: 21,
  },
  {
    lake: "Lake B",
    species: "Salmon",
    count: 16,
  },
  {
    lake: "Lake C",
    species: "Bass",
    count: 15,
  },
  {
    lake: "Lake C",
    species: "Trout",
    count: 25,
  },
  {
    lake: "Lake C",
    species: "Catfish",
    count: 31,
  },
  {
    lake: "Lake C",
    species: "Perch",
    count: 22,
  },
  {
    lake: "Lake C",
    species: "Salmon",
    count: 31,
  },
  {
    lake: "Lake D",
    species: "Bass",
    count: 12,
  },
  {
    lake: "Lake D",
    species: "Trout",
    count: 17,
  },
  {
    lake: "Lake D",
    species: "Catfish",
    count: 23,
  },
  {
    lake: "Lake D",
    species: "Perch",
    count: 23,
  },
  {
    lake: "Lake D",
    species: "Salmon",
    count: 41,
  },
  {
    lake: "Lake E",
    species: "Bass",
    count: 7,
  },
  {
    lake: "Lake E",
    species: "Trout",
    count: 9,
  },
  {
    lake: "Lake E",
    species: "Catfish",
    count: 13,
  },
  {
    lake: "Lake E",
    species: "Perch",
    count: 20,
  },
  {
    lake: "Lake E",
    species: "Salmon",
    count: 40,
  },
  {
    lake: "Lake F",
    species: "Bass",
    count: 4,
  },
  {
    lake: "Lake F",
    species: "Trout",
    count: 7,
  },
  {
    lake: "Lake F",
    species: "Catfish",
    count: 9,
  },
  {
    lake: "Lake F",
    species: "Perch",
    count: 21,
  },
  {
    lake: "Lake F",
    species: "Salmon",
    count: 47,
  },
];
```

:::

## The Dataset

The dataset we'll work with in this tutorial is counts of the number of fish caught in different
lakes.

```ts
type SeafoodData = {
  lake: "Lake A" | "Lake B" | "Lake C" | "Lake D" | "Lake E" | "Lake F";
  species: "Bass" | "Trout" | "Catfish" | "Perch" | "Salmon";
  count: number;
};

const seafood: SeafoodData[] = [
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

## The Starter Code and Rectangle Shape

Let's take a look at the starter code. First, we grab a DOM element that will serve as the container
we render into:

```ts
const root = document.getElementById("app");
```

Next, we render a rectangle into it!

:::starfish

```ts
Rect({ x: 0, y: 0, w: 32, h: 300, fill: color.green[5] }).render(root, {
  w: 500,
  h: 300,
});
```

:::

`Rect` creates a shape. `x`, `y`, `w`, and `h` specify the position and size of the rectangle. The
`fill` parameter specifies the color. We are using a green from GoFish's default color palette for
this chart. Try changing `green` to `red` or changing `5` to a higher or lower number.

Finally, we call `.render` to render the shape to the DOM, specifying a width and height for the
entire graphic.

## Bar Chart

The first thing we'll do is compare the number of fish in each lake. We can use a bar chart for
that. To turn our stack of rectangles into a bar chart, we'll need to take a few steps. First, we'll just create one
bar for
each lake in the dataset:

:::starfish

```ts
rect(seafood, { w: 32, h: 300, fill: color.green[5] })
  .spreadX("lake")
  .render(root, { w: 500, h: 300 });
```

:::

### The `spread` operator

We've introduced a `StackX` _graphical operator_ that spaces its children 8 pixels apart. The `For`
function maps over its input dataset, and calls the anonymous function on each one. In this case,
we've grouped our dataset by lake so that we'll call the `Rect` shape six times.

### Data-Driven Fields

To turn this into a bar chart, we'll change the `h` encoding of the `Rect` shape to a data-driven
quantity.

:::starfish

```ts
rect(seafood, { w: 32, h: "count", fill: color.green[5] })
  .spreadX("lake")
  .render(root, { w: 500, h: 300 });
```

:::

### Inferred Fields

We remove the `w` field from our spec to have GoFish infer it for us. GoFish uses the overall size
of the chart we gave to `render` as well as the sizing information in `spreadX` to determine the
width of each rectangle.

:::starfish

```ts
rect(seafood, { h: "count", fill: color.green[5] })
  .spreadX("lake")
  .render(root, { w: 500, h: 300 });
```

:::

## Axes

Great! Now let's talk about how to add axes to your chart. GoFish can automatically infer axes from
your spec as long as you put `axes: true` in the `render` method like so:

:::starfish

```ts
rect(seafood, { h: "count", fill: color.green[5] })
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
```

:::

<!-- Awesome. Now we have a y-axis. But what about the x-axis? Since the x-axis is a discrete quantity
not tied to an argument like `h`, we'll need to pass a `key` field to the objects we want to label:

:::starfish

```ts
StackX(
  { spacing: 8, sharedScale: true },
  For(groupBy(seafood, "lake"), (lake, key) =>
    Rect({ key, w: 32, h: v(sumBy(lake, "count")), fill: color.green[5] })
  )
).render(root, { w: 500, h: 300, axes: true });
```

::: -->

Voila! Now we have a y-axis and labels for each of the bars.

<!-- Notice also that we've added a `key` field to the `Rect`. This let's GoFish know the identity of -->
<!-- each -->

## Stacked Bar Chart

Now we have a sense of the number of fish in each lake. It seems like Lake B has the most. What if
we broke this down by species? We can use a stacked bar chart for that. A stacked bar chart is kinda
like a normal bar chart, except instead of a line of rectangles, it's a line of _stacked_ rectangles.

:::starfish

```ts
rect(seafood, { h: "count", fill: color.green[5] })
  .stackY("species")
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
```

:::

<!-- We've added a `StackY` in between the `StackX` and the `Rect`. This creates a vertical stack that
iterates over every species in each lake. Notice we've also changed `Rect`'s encoding from a sum
over all the species in the lake to the direct count.

::: info

Note: We've moved the key to the `StackY` from the `Rect` to keep the label on the elements produced
by the `For` loop.

::: -->

Now we have a rectangle for each species in each lake. But we can't tell the fish apart! Let's add a
color encoding so that each rectangle's color corresponds to the species of fish.

:::starfish

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
```

:::

Much better! Notice that we also have a color legend telling us what each color represents. This was
created automatically because have set `axes: true` on the `render` method.

### The `stack` operator

Notice we've used the `stack` operator to create this stack of bars. `stack` works a lot like
`spread`, but it "glues" shapes tightly together. This lets us keep the continuous y-axis, for example.

## Ribbon Chart

### Data Transformation

Now we have a sense of the break down by lake, but these lakes are connected by a river! It's hard
to track how the proportion of fish changes between each lake. Let's first try ordering the bars by
their counts:

:::starfish

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .transform((d) => orderBy(d, "count", "desc"))
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
```

:::

Some trends pop out. The salmon population spikes between lakes B and C while catfish appear to
decline. We can make these trends more obvious by connecting rectangles of the same species
together.

<!-- :::starfish

```ts
Frame([
  StackX(
    { spacing: 8, sharedScale: true },
    For(groupBy(seafood, "lake"), (lake, key) =>
      StackY(
        { key, spacing: 1 },
        For(orderBy(lake, "count", "desc"), (d) =>
          Rect({ w: 32, h: v(d.count), fill: v(d.species) }).name(
            `${d.lake}-${d.species}`
          )
        )
      )
    )
  ),
  For(groupBy(seafood, "species"), (items) =>
    ConnectX(
      { opacity: 0.8 },
      For(items, (d) => Ref(`${d.lake}-${d.species}`))
    )
  ),
]).render(root, { w: 500, h: 300, axes: true });
```

::: -->

### The `connect` operator

:::starfish

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .transform((d) => orderBy(d, "count", "desc"))
  .spreadX("lake")
  .connectX("species", { over: "lake" })
  .render(root, { w: 500, h: 300, axes: true });
```

:::

Great! This is already a ribbon chart but it's a little funky. We'll fix the funkiness in a second,
but first let's understand what's going on.

First, we've added a `Frame` operator that lets us layer on multiple elements in the same space.
Next, we've added a `name` to the `Rect` shapes so that we can refer to them later. Finally, we've
added `ConnectX` operators that connect the `Rect`s horizontally. To refer to the existing `Rect`s
we're using `Ref` shapes. These shapes act as "pointers" to existing shapes.

To make this look more like a traditional ribbon chart, all we have to do is change the spacing of
the `StackX` and the width of each `Rect`.

:::starfish

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .transform((d) => orderBy(d, "count", "desc"))
  .spreadX("lake", { spacing: 64 })
  .connectX("species", { over: "lake", opacity: 0.8 })
  .render(root, { w: 500, h: 300, axes: true });
```

:::

<!-- :::starfish

```ts
Frame([
  StackX(
    { spacing: 64, sharedScale: true },
    For(groupBy(seafood, "lake"), (lake, key) =>
      StackY(
        { key, spacing: 1 },
        For(orderBy(lake, "count", "desc"), (d) =>
          Rect({ w: 16, h: v(d.count), fill: v(d.species) }).name(
            `${d.lake}-${d.species}`
          )
        )
      )
    )
  ),
  For(groupBy(seafood, "species"), (items) =>
    ConnectX(
      { opacity: 0.8 },
      For(items, (d) => Ref(`${d.lake}-${d.species}`))
    )
  ),
]).render(root, { w: 500, h: 300, axes: true });
```

::: -->

## Polar Ribbon Chart

Finally it's time to make our polar ribbon chart! To do so, we'll add a `Polar` coordinate transform
to the `Frame`, adjust the parameters to `StackX`, the width of the `Rect`, and reverse the `StackY`
so that it appears in the proper direction.

:::starfish

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species", { reverse: true })
  .transform((d) => orderBy(d, "count", "desc"))
  .spreadX("lake", {
    y: 50,
    x: (-3 * Math.PI) / 6,
    spacing: (2 * Math.PI) / 6,
    alignment: "start",
    mode: "center",
  })
  .connectX("species", { over: "lake", opacity: 0.8 })
  .coord(polar())
  .render(root, { w: 500, h: 300, transform: { x: 200, y: 150 } });
```

:::

## What's next?

Go check out some of our [examples](/examples/index)!
