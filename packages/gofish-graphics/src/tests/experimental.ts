// // @ts-nocheck
// StackX(titanic, { spacing: 0, alignment: "middle" }, [
//   Rect({ w: 40, h: v.sumBy("count").then((d) => d / 10), fill: "gray" }),
//   StackX({ h: v.sumBy("count"), spacing: 0, alignment: "start" }).stackY(v.class, { spacing: 0, alignment: "middle" }),
// ]);

Chart(titanic)
  .rect({
    h: v.sumBy("count").then((d) => d / 10),
    fill: (d) =>
      d.sex === "Female"
        ? d.survived === "No"
          ? mix(color6_old[2], black, 0.5)
          : mix(color6_old[2], white, 0.5)
        : d.survived === "No"
        ? mix(color6_old[3], black, 0.5)
        : mix(color6_old[3], white, 0.5),
  })
  .stackY(v.survived, { w: 40, spacing: 0, alignment: "middle" })
  .stackX({ spacing: 0, alignment: "middle" }, (view) => [
    Rect({ w: 40, h: v.sumBy("count").then((d) => d / 10), fill: v.sex }),
    view,
  ])
  .stackY(v.sex, { spacing: 0, alignment: "middle" })
  .stackX({ h: v.sumBy("count") / 10, spacing: 0, alignment: "start" }, (view) => [
    Rect({ w: 40, fill: v.class }),
    view,
  ])
  .stackY(v.class, { spacing: 0, alignment: "middle" })
  .stackX({ spacing: 0, alignment: "middle" }, (view) => [
    Rect({ w: 40, h: v.sumBy("count").then((d) => d / 10), fill: "gray" }),
    view,
  ]);

const internalSpacing = 2;
const layerSpacing = 64;
const test = gofish(
  titanic,
  stackY("class", { spacing: internalSpacing }),
  stackY("sex", { spacing: internalSpacing * 2 }),
  stackY("survived", { spacing: internalSpacing * 4 }),
  rect({ w: 40, h: "count", fill: "sex" })
);

const test2 = chart(
  titanic,
  stackX({ spacing: layerSpacing, alignment: "middle" }, [
    chart(stackY("class", { spacing: 0, alignment: "middle" }), rect({ w: 40, h: "count", fill: "gray" })),
    chart(
      stackY("class", { spacing: internalSpacing }),
      stackX({ spacing: layerSpacing, alignment: "middle" }, [
        chart(stackY("sex", { spacing: 0, alignment: "middle"}))
        chart(
          stackY("sex", { spacing: internalSpacing * 2 }),
          stackY("survived", { spacing: internalSpacing * 4 }),
          rect({ w: 40, h: "count", fill: "sex" })
        ),
      ])
    ),
  ])
);

const test3 = gf(titanic)
.stackX({ spacing: layerSpacing, alignment: "middle" }, [
  gf()
    .stackY("class", { spacing: 0, alignment: "middle" })
    .rect({ w: 40, h: "count", fill: "gray" }),
  gf()
    .stackY("class", { spacing: internalSpacing })
    .stackX({ spacing: layerSpacing, alignment: "middle" }, [
      gf()
        .stackY("sex", { spacing: 0, alignment: "middle" })
        .rect({ w: 40, h: "count", fill: "sex" }),
    ]),
  ]);


Background({ padding: 20}, StackX({ spacing: 50 }, [
  Text({ text: "Hello", fontSize: 20 }).name("A"),
  Text({ text: "Hello", fontSize: 20 }).name("B"),
  Arrow({}, [Ref("A"), Ref("B")]),
]))

Group([
  Background({ padding: 20}, StackX({ spacing: 50 }, [
    Text({ text: "Hello", fontSize: 20 }).name("A"),
    Text({ text: "Hello", fontSize: 20 }).name("B"),
  ])),
  ({ A, B }) => Arrow({}, [A, B]),
  Arrow({}, [A, B]))
])

// Background({ padding: 20}, StackX({ spacing: 50 }, [
//   Text({ text: "Hello", fontSize: 20 }).name("A"),
//   Text({ text: "Hello", fontSize: 20 }).name("B"),
//   Arrow({}, [Ref("A"), Ref("B")]),
// ]))


// "square"
rect(df, { fill: "red" })

// "square"
rect(df, { fill: "red" })
  // automatically averages over x and y values for every entry in the group
  .scatter("lake", { x: "x", y: "y" })

// rect(df, { x: "x", y: "y", fill: "red" })
//   .scatter("lake")

// rect(df, { x: "x", y: "y", fill: "red" })
//   .layer("lake")

// rect(df, { x: "x", y: "y", fill: "red" })
//   .facet("lake")

// "bar"
// automatically sums over count for each group
rect(df, { fill: "lake", h: "count" })
  .stackX("lake")

// "bar" w/ stack
rect(df, { fill: "lake" })
  .divideY("species")
  .stackX("lake")

// "bar" w/ stack, change color
rect(df, { fill: "species" })
  .divideY("species")
  .stackX("lake")

// ribbon chart (hard to do!)
rect(df, { fill: "red" })
  .divideY("species")
  .stackX("lake")
  .connectX("species"/* , { over: "lake"} */)

// switching divide to a stack to get some spacing
rect(df, { fill: "red" })
  .stackY("species")
  .stackX("lake")
  .connectX("species")

// polar coordinate transformation of the chart
rect(df, { fill: "red" })
  .stackY("species")
  .stackX("lake")
  .connectX("species")
  .coord(polar())

// pie chart (TODO)

// scatterpie




sf.chart(catchData)
  .spreadX("lake")
  .derive(orderBy("count"))
  .stackY("species", { w: "count" })
  .rect({ fill: "species", h: "count" });

/*  */ _(catchData).groupBy("lake").orderBy("count").groupBy("species");
sf.chart(catchData).spreadX("lake").derive(orderBy("count")).stackY("species").rect(/* ... */);

let foo = sf.chart(catchData).spreadX("lake").derive(orderBy("count")).stackY("species").rect(/* ... */);
connectX(foo, { by: "species", over: "lake" });
sf.chart(catchData).connectX("species")

sf.chart(catchData).layer(
  spreadX("lake")
  .derive(orderBy("count"))
  .stackY("species", { w: "count" })
  .rect({ fill: "species", h: "count" }),
  connectX("species")
)

sf.chart(catchData).layer(
  sf.chart()
    .spreadX("lake")
    .derive(orderBy("count"))
    .stackY("species", { w: "count" })
    .rect({ fill: "species", h: "count" }),
  sf.chart().connectX("species")
)



/* 

chart(seafood)
  .spreadX("lake")
  .stackY("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connectX(by="species"))

chart(seafood)
  .spread_x("lake")
  .stack_y("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect_x(by="species"))

chart(seafood)
  .spread_by("lake", dir="x")
  .stack_by("species", dir="y")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect_x(by="species"))

chart(seafood)
  .x_spread("lake")
  .y_stack("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(x_connect(by="species"))


chart(seafood)
  .spread("lake", dir="x")
  .stack("species", dir="y")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect(by="species", dir="x"))

chart(seafood)
  .spreadX("lake")
  .stackY("species")
  .rect(h="count", fill="species")


chart(seafood)
  .spread_by("lake", dir="x")
  .stack_by("species", dir="y")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect(on="species", dir="x"))


chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect_x(on="species"))

chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect_x(on="species"))
  .coord(polar())

(chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species")
+ connect_x(on="species"))
  .coord(polar())

chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect_x(on="species"))
  .coord(polar())


layer(
  chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species"),
  connect_x(on="species")
)
  .coord(polar())

coord(polar()).layer(
  chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species"),
  connect_x(on="species")
)

layer(coord=polar(),
  chart(seafood)
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species"),
  connect_x(on="species")
)

chart(seafood, coord=polar())
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species")
  .add(connect_x(on="species"))

chart(seafood, coord=polar())
  .spread_x_by("lake")
  .stack_y_by("species")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect_x(on="species"))


// bar chart
chart(seafood)
  .spread_by("lake", dir="x")
  .rect(h="count")

// stacked bar chart
chart(seafood)
  .spread_by("lake", dir="x")
  .stack_by("species", dir="y")
  .rect(h="count", fill="species")

// sorted stacked bar chart
chart(seafood)
  .spread_by("lake", dir="x")
  .stack_by("species", dir="y")
  .sort("count")
  .rect(h="count", fill="species")

// sorted ribbon chart
chart(seafood)
  .spread_by("lake", dir="x")
  .stack_by("species", dir="y")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect(on="species", dir="x"))

// sorted polar ribbon chart
chart(seafood, coord=polar())
  .spread_by("lake", dir="x")
  .stack_by("species", dir="y")
  .sort("count")
  .rect(h="count", fill="species")
  .layer(connect(on="species", dir="x"))

// mosaic chart
chart(seafood)
  .spread_by("lake", w="count", dir="x")
  .stack_by("species", dir="y")
  .rect(h=pl.col("count").normalize()) // normalize doesn't actually exist lol

// scatter plot
chart(seafood)
  .scatter_by("lake", x="x", y="y")
  .circle()

// line chart
chart(seafood)
  .scatter_by("lake", x="x", y="y")
  .ghost()
  .layer(connect_x(on="lake"))

// area chart
chart(seafood)
  .scatter_by("lake", x="x")
  .ghost(h="y")
  .layer(connect_x(on="lake"))

// v2
// scatter plot
chart(seafood)
  .group_by("lake")
  .circle(x="x", y="y")

// line chart
chart(seafood)
  .group_by("lake")
  .ghost(x="x", y="y")
  .layer(connect_x(on="lake"))

// area chart
chart(seafood)
  .group_by("lake")
  .ghost(x="x", h="y")
  .layer(connect_x(on="lake"))

// area chart (reads weird... but does get the alignment in place...)
chart(seafood)
  .align_by("lake", dir="y")
  .ghost(x="x", h="y")
  .layer(connect_x(on="lake"))

// scatterpie
chart(seafood)
  .scatter_by("lake", x="x", y="y")
  .coord(polar())
  .stackX("species", h="count")
  .rect(fill="species", w="count")

// scatterpie v2
chart(seafood)
  .group_by("lake")
  .layer(coord=polar(), x="x", y="y")
  .stackX("species", h="count")
  .rect(fill="species", w="count")

// scatterpie v3
chart(seafood)
  .group_by("lake")
  .nest(coord=polar(), x="x", y="y",
    chart()
      .stackX("species", h="count")
      .rect(fill="species", w="count")
  )

// scatterpie v4
chart(seafood)
  .group_by("lake")
  .chart(coord=polar(), x="x", y="y",
    stackX("species", h="count")
    .rect(fill="species", w="count")
  )

// scatterpie v5
chart(seafood)
  .scatter_by("lake", x="x", y="y")
  .chart(coord=polar()
    stackX("species", h="count")
    .rect(fill="species", w="count")
  )

// box and whisker test
chart(genderPayGap)
  .spread_by("Pay Grade", dir="x")
  .stack_by("Gender", dir="x")
  .box(w=16, fill="Gender")


def box(median, min, max, q1, q3, fill, w=8):
  return layer(
    rect(y=0, w=0, h=0),
    minLine := rect(w, h=w/8, y=min, fill="gray"),
    maxLine := rect(w, h=w/8, y=max, fill="gray"),
    connect(minLine, maxLine, dir="y"),
    rect(w, h=q3-q1, y=q1, fill=fill),
    rect(w, h=w/8, y=median, fill="white"),
  )

...do some stuff to turn it into a "mark"

// box and whisker test
chart(genderPayGap)
  .spread_by("Pay Grade", dir="x")
  .stack_by("Gender", dir="x")
  // I think this might have to be a "group" and not a "layer" for similar reasons as Mascot
separating glyphs and collections... glyph makes a group of things, one for each row. layer passes
entire dataset through? to be continued...
  .group(
    rect(y=0, w=0, h=0),
    minLine := rect(w, h=w/8, y=min, fill="gray"),
    maxLine := rect(w, h=w/8, y=max, fill="gray"),
    connect(minLine, maxLine, dir="y"),
    rect(w, h=q3-q1, y=q1, fill=fill),
    rect(w, h=w/8, y=median, fill="white")
  )
*/