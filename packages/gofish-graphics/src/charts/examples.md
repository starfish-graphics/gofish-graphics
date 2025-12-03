# Examples

## Bar Chart

```ts
chart.bar(alphabet, { x: "letter", y: "frequency" });
```

Already we run into an ambiguity of which direction this bar chart will run. We could disambiguate
this by inferring from the types of `x` and `y` which direction it should be (a la Vega-Lite). So in
this case the spread would go horizontally because `letter` is a string and `frequency` is a number.
But in general this is not possible b/c there are other kinds of charts (eg masonry, tree) where the
direction is ambiguous b/c both directions are discrete or else don't give enough information to
infer the direction.

We could also choose to bake the direction into the chart name like in Observable Plot:

```ts
chart.barY(alphabet, { x: "letter", y: "frequency" });
```

But this direction can be unintuitive for some users.

One possibility that addresses both of these issues is to use `dir` at this level in a way that
mirrors its mid-level usage. So for example, in the mid level this bar chart would be written as:

```ts
chart(alphabet)
  .flow(spread("letter", { dir: "x" }))
  .mark(rect({ h: "frequency" }));
```

So in the high level we would write:

```ts
chart.bar(alphabet, { x: "letter", y: "frequency", dir: "x" });
```

## Stacked and Grouped Bar Charts

In the mid-level API, we can make stacked and grouped bars using the `stack` operator.

Grouped:

```ts
chart(stateage)
  .flow(spread("state", { dir: "x" }), stack("age", { dir: "x" }))
  .mark(rect({ h: "population", fill: "age" }));
```

Stacked:

```ts
chart(stateage)
  .flow(spread("state", { dir: "x" }), stack("age", { dir: "y" }))
  .mark(rect({ h: "population", fill: "age" }));
```

In the high level, we would like to write the stack as a method chain. The `bar` "mark"/"chart"
should specify the meaning of stacking. (I could see there being special rules about what
constitutes a "stack" at this level similar to monad laws.)

Grouped:

```ts
chart
  .bar(stateage, { x: "state", y: "population", fill: "age", dir: "x" })
  .stack("age", { dir: "x" });
```

Stacked:

```ts
chart
  .bar(stateage, { x: "state", y: "population", fill: "age", dir: "x" })
  .stack("age", { dir: "y" });
```

## Area Chart

Similar to bar chart case.

## Pie Chart

```ts
chart.pie(alphabet, { x: "letter", ???: "frequency" })
```

Here we run into another problem. Unlike a bar chart, where there is a position encoding on the
x-axis and a height encoding on the y-axis, the pie chart uses both a position and a "width"
encoding on the same axis. We can't play the same trick as with bars. Instead we could try

```ts
chart.pie(alphabet, { x: "letter", w: "frequency" });
```

This also frees us up to easily do rose charts etc.

Revisiting the bar chart, we could write:

```ts
chart.bar(alphabet, { x: "letter", h: "frequency", dir: "x" });
```

Although now we've broken the symmetry in horizontal and vertical bars so maybe we don't need the
`dir` anymore:

```ts
chart.bar(alphabet, { x: "letter", h: "frequency" });
```

This prompts us to ask what using `y` instead of `h` would do. Which in a few hops I think gets us
to the idea of using `x` and `y` to encode spreads, grids, and scatters depending on how they are
used and with what data types.

Another approach we can take (similar to ggplot2) is to leave off the x encoding completely and just
do

```ts
chart.pie(alphabet, { x: "frequency" });
```
