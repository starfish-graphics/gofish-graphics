const classColor = {
  First: gf.color6[0],
  Second: gf.color6[1],
  Third: gf.color6[2],
  Crew: gf.color6[3],
};

gf.stackX({ spacing: 0, alignment: "middle" }, [
  gf.rect({
    w: 40,
    h: _(titanic).sumBy("count") / 10,
    fill: gf.neutral,
  }),
  gf.stackY(
    { reverse: true, spacing: 0, alignment: "middle" },
    _(titanic)
      .groupBy("class")
      .map((items, cls) =>
        gf.stackX(
          {
            h: _(items).sumBy("count") / 10,
            spacing: 0,
            alignment: "start",
          },
          [
            gf.rect({ w: 40, fill: classColor[cls] }),
            gf.stackY(
              { reverse: true, spacing: 0, alignment: "middle" },
              _(items)
                .groupBy("sex")
                .map((items, sex) =>
                  gf.stackX({ spacing: 0, alignment: "middle" }, [
                    gf.rect({
                      w: 0,
                      h: _(items).sumBy("count") / 10,
                      fill: sex === "Female" ? gf.color6[4] : gf.color6[5],
                    }),
                    gf.stackY(
                      {
                        w: 40,
                        reverse: true,
                        spacing: 0,
                        alignment: "middle",
                      },
                      _(items)
                        .groupBy("survived")
                        .map((survivedItems, survived) => {
                          return gf.rect({
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
