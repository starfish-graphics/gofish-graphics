# Forward Syntax

## Why forward syntax?

The two proposal on the table are "reverse" syntax and "forward" syntax. Let's look at some examples first.

### Stacked Bar Chart

**Reverse**

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
```

**Forward**

```ts
data(seafood)
  .flow(spreadBy("lake", { dir: "x" }), stackBy("species", { dir: "y" }))
  .mark(rect({ h: "count", fill: "species" }));
```

### Ribbon Chart

**Reverse**

```ts
rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .derive(sort("count"))
  .spreadX("lake", { spacing: 64 })
  .connectX("species", { over: "lake", opacity: 0.8 })
  .render(root, { w: 500, h: 300, axes: true });
```

**Forward**

**probably need a few more examples to figure this out........**

```ts
data(seafood).layer(
  flow(
    spreadBy("lake", { dir: "x" }), //
    stackBy("species", { dir: "y" })
  ).mark(rect({ h: "count", fill: "species" })),
  flow(
    /* put something here? */
    derive(groupBy("species")), //
    connectBy("lake")
    /* put something here? */
  ).mark(/* ??? */)
);
```

### Waffle Chart (not actually implemented yet)

**Reverse**

```ts
rect(seafood, { w: 8, h: 8, fill: "species" })
  .spreadX({ spacing: 2 })
  .spreadY({ spacing: 2 })
  .derive((d) => flatMap((d) => repeat(d, "count")).chunk(5))
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
```

**Forward**

```ts
data(seafood).flow(
  spreadBy("lake", { dir: "x" }),
  derive((d) => flatMap((d) => repeat(d, "count")).chunk(5)),
  spreadBy(/* undefined/index/no arg, */ { spacing: 2, dir: "y" }),
  spreadBy(/* undefined/index/no arg, */ { spacing: 2, dir: "x" }),
  rect({ w: 8, h: 8, fill: "species" })
);
```

So as you can see from these examples here are some takeaways

- reverse syntax is more familiar to GoG users b/c it starts with the mark
- however reverse syntax is very confusing in the presence of data transformations, especially ones
  that introduce fields (eg in waffle chart example) b/c the data transforms flow _upwards_ while
  the rest of the spec tricks you into thinking it runs _downwards_. In fact, the flow runs from the
  dataset then _upwards_ through the operators and finally ends at the mark at the top. The forward
  syntax makes this dataflow much clearer. The trickiness of this doesn't make sense until you start
  writing slightly more complicated charts like the waffle chart. Upwards flow also messes things up
  when it comes to branching (arguably... it might be ok either way)
- the forward syntax is much easier to max extensible. While dot chaining can connote forward or
  reverse data flow (think data flow in polars for forwards and modifiers in swiftui for reverse),
  it is very hard to make a reverse flow using the function arguments approach that is needed for
  easy extensibility. We care A LOT about users being able to define their own marks and operators
  that work like built-in ones so we will not compromise on this.
- but one big downside of the forward syntax currently is that it makes the `connect` operator
  significantly more verbose. This verbosity is something we will likely have to reckon with anyway
  for more complicated use cases like adding chart annotations in the driving shifts connected
  scatter plot that will require a more sophisticated selection API. So a question is can we defer
  all of that for our current set of examples and just do the simple thing? My current intuition is
  that for these kinds of layers that are dependent on previous ones, their source is still data,
  but their sink is now a selection instead of a mark. (Of course we can think of a selection or ref
  as a special kind of mark as we do in Bluefish.) The other very natural approach to try is to
  somehow return a reference to the previous layer such that it is a map between data and shapes so
  that it can be selected. For example I was thinking about this syntax about a year ago for
  Observable Plot:

```ts
// create a reference to the dot marks so they can be drawn first, but also referred to later
let dots = Plot.dot(…)

// use Plot.pointer to filter the dots and only add tooltips to those marks
Plot.tip(tooltipData, Plot.pointer(dots))
```

```ts
const dots = data(...).flow(scatter(...)).mark(circle(...))

const selectedDots = data(selectPointer(dots, "x")).mark(circle(..."red"...))

data(selectedDots).mark(tip(...))
```

So this suggests that selections/data should be able to be used as inputs to other flows...

driving shifts

```ts
const dots = data(drivingShifts).flow(scatter(...)).mark(circle(...))

// hmm... no?
const line = data(dots).flow(connect(..."x"...)).mark()
const line = data().flow(connect(..."x"...)).mark(select(dots))

// ??? join???
const spanAnnots = data(timeSpanAnnotations).mark(label({text, }))
```

Another idea

```ts
chart({
  data,
  coord,
  flow,
  mark,
  connect,
  render,
});
```

```ts
chart({ data, coord, w, h, axes }).flow().mark().render(root);
```

In these cases, `connect` is a separate field since all the basic examples only do straightforward
things with `connect`. It's quite simple and avoids conceptual baggage like layers and references to
make simple charts. On the other hand, it does make `connect` feel different from the other
operators.

```ts
chart(seafood)
  .flow(spread("lake", { dir: "x" }), stack("species", { dir: "y" }))
  .mark(rect({ h: "count", fill: "species" }));
```

```ts
chart(seafood).marks([
  flow(
    spread("lake", { dir: "x" }), //
    stack("species", { dir: "y" })
  )
    .mark(rect({ h: "count", fill: "species" }))
    .as("bars"),
  flow(derive(groupBy("species")), connect(ref("bars"))),
]);
```

```ts
chart(seafood).marks([
  flow(
    spread("lake", { dir: "x", spacing: 64 }),
    derive(sortBy("count")),
    stack("species", { dir: "y" })
  )
    .mark(rect({ w: 16, h: "count", fill: "species" }))
    .as("bars"),
  flow(
    derive(groupBy("species")), //
    connect("lake", { dir: "x", opacity: 0.8 })
  ).mark(join("bars")),
]);
```

Ok I can get behind this syntax!!!

I guess in this case you could also start the flow with a `selection` of some data instead of ending
with a `join`, because they are the same, but the selection thing introduces a bigger can of
worms...

```ts
layer([
  data(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64 }),
      derive(sortBy("count")),
      stack("species", { dir: "y" })
    )
    .mark(rect({ w: 16, h: "count", fill: "species" }))
    .as("bars"),
  // an array of data with key and mark ref
  data(select("bars"))
    // array is now grouped by species with one mark produced for each one
    .flow(derive(groupBy("species")))
    // species array is passed as children(?) to connect
    .mark(connect({ dir: "x", opacity: 0.8 })),
]);
```

Ok this one seems _really_ good actually! Huh... wow! I will build out as many syntax examples as I
can using this strategy.
