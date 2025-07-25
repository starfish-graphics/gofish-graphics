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