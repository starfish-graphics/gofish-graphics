const classColor = {
  First: gf.color6[0],
  Second: gf.color6[1],
  Third: gf.color6[2],
  Crew: gf.color6[3],
};

gf.StackX({ spacing: 0, alignment: "middle" }, [
  gf.Rect({
    w: 40,
    h: _(titanic).sumBy("count") / 10,
    fill: gf.neutral,
  }),
  gf.StackY(
    { dir: "ttb", spacing: 0, alignment: "middle" },
    _(titanic)
      .groupBy("class")
      .map((items, cls) =>
        gf.StackX(
          {
            h: _(items).sumBy("count") / 10,
            spacing: 0,
            alignment: "start",
          },
          [
            gf.Rect({ w: 40, fill: classColor[cls] }),
            gf.StackY(
              { dir: "ttb", spacing: 0, alignment: "middle" },
              _(items)
                .groupBy("sex")
                .map((items, sex) =>
                  gf.StackX({ spacing: 0, alignment: "middle" }, [
                    gf.Rect({
                      w: 0,
                      h: _(items).sumBy("count") / 10,
                      fill: sex === "Female" ? gf.color6[4] : gf.color6[5],
                    }),
                    gf.StackY(
                      {
                        w: 40,
                        dir: "ttb",
                        spacing: 0,
                        alignment: "middle",
                      },
                      _(items)
                        .groupBy("survived")
                        .map((survivedItems, survived) => {
                          return gf.Rect({
                            h: _(survivedItems).sumBy("count") / 10,
                            fill:
                              sex === "Female"
                                ? survived === "No"
                                  ? gf.gray
                                  : gf.color6[4]
                                : survived === "No"
                                ? gf.gray
                                : gf.color6[5],
                          });
                        })
                        .value()
                    ),
                  ])
                )
                .value()
            ),
          ]
        )
      )
      .value()
  ),
]).render(root, { w: 500, h: 300 });
