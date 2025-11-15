const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

StackY(
  { spacing: 4, alignment: "middle" },
  For(groupBy(titanic, "class"), (items, cls) =>
    StackX(
      { h: _(items).sumBy("count") / 10, spacing: 2, alignment: "middle" },
      For(groupBy(items, "sex"), (sItems, sex) =>
        StackY(
          {
            w: (_(sItems).sumBy("count") / _(items).sumBy("count")) * 100,
            spacing: 0,
            alignment: "middle",
            sharedScale: true,
          },
          For(groupBy(sItems, "survived"), (items, survived) =>
            Rect({
              h: v(_(items).sumBy("count")),
              fill: survived === "No" ? gray : classColor[cls],
            })
          )
        )
      )
    )
  )
).render(root, { w: 500, h: 300 });
