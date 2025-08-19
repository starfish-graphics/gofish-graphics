const classColor = {
  First: color.red[5],
  Second: color.blue[5],
  Third: color.green[5],
  Crew: color.orange[5],
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
              fill:
                survived === "No"
                  ? mix(classColor[cls], black, 0.7)
                  : classColor[cls],
            })
          )
        )
      )
    )
  )
).render(root, { w: 500, h: 300 });
