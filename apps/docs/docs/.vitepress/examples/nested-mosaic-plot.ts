const classColor = {
  First: gf.color6[0],
  Second: gf.color6[1],
  Third: gf.color6[2],
  Crew: gf.color6[3],
};

gf.stackY(
  { spacing: 4, alignment: "middle" },
  gf.For(_.groupBy(titanic, "class"), (items, cls) =>
    gf.stackX(
      { h: _(items).sumBy("count") / 10, spacing: 2, alignment: "middle" },
      gf.For(_.groupBy(items, "sex"), (sItems, sex) =>
        gf.stackY(
          {
            w: (_(sItems).sumBy("count") / _(items).sumBy("count")) * 100,
            spacing: 0,
            alignment: "middle",
            sharedScale: true,
          },
          gf.For(_.groupBy(sItems, "survived"), (items, survived) =>
            gf.rect({
              h: gf.v(_(items).sumBy("count")),
              fill: survived === "No" ? gf.gray : classColor[cls],
            })
          )
        )
      )
    )
  )
).render(root, { w: 500, h: 300 });
