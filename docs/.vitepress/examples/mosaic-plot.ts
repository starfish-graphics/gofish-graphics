const data = [
  { origin: "Europe", cylinders: "4", count: 66 },
  { origin: "Europe", cylinders: "5", count: 3 },
  { origin: "Europe", cylinders: "6", count: 4 },
  { origin: "Japan", cylinders: "3", count: 4 },
  { origin: "Japan", cylinders: "4", count: 69 },
  { origin: "Japan", cylinders: "6", count: 6 },
  { origin: "USA", cylinders: "4", count: 72 },
  { origin: "USA", cylinders: "6", count: 74 },
  { origin: "USA", cylinders: "8", count: 108 },
];

StackX(
  { spacing: 4, alignment: "end" },
  // TODO: I could probably make the width be uniform flexible basically
  For(groupBy(data, "origin"), (items, origin) =>
    StackY(
      {
        w: _(items).sumBy("count") / 2,
        spacing: 2,
        alignment: "middle",
        sharedScale: true,
      },
      For(items.toReversed(), (d) =>
        Rect({
          h: v(d.count),
          fill:
            d.origin === "Europe"
              ? gf.color.red[5]
              : d.origin === "Japan"
              ? gf.color.blue[5]
              : gf.color.green[5],
        })
      )
    )
  )
).render(root, { w: 500, h: 300 });

/* 
// TODO: need some kind of normalization...

rect(data, {h: "count", fill: "origin"})
  .stackY("cylinders", { w: "count" })
  .stackX("origin")
*/
