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