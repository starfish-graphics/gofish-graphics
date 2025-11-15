const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

StackX({ spacing: 0, alignment: "middle" }, [
  Rect({
    w: 40,
    h: _(titanic).sumBy("count") / 10,
    fill: neutral,
  }),
  StackY(
    { dir: "ttb", spacing: 0, alignment: "middle" },
    _(titanic)
      .groupBy("class")
      .map((items, cls) =>
        StackX(
          {
            h: _(items).sumBy("count") / 10,
            spacing: 0,
            alignment: "start",
          },
          [
            Rect({ w: 40, fill: classColor[cls] }),
            StackY(
              { dir: "ttb", spacing: 0, alignment: "middle" },
              _(items)
                .groupBy("sex")
                .map((items, sex) =>
                  StackX({ spacing: 0, alignment: "middle" }, [
                    Rect({
                      w: 0,
                      h: _(items).sumBy("count") / 10,
                      fill: sex === "Female" ? color6[4] : color6[5],
                    }),
                    StackY(
                      {
                        w: 40,
                        dir: "ttb",
                        spacing: 0,
                        alignment: "middle",
                      },
                      _(items)
                        .groupBy("survived")
                        .map((survivedItems, survived) => {
                          return Rect({
                            h: _(survivedItems).sumBy("count") / 10,
                            fill:
                              sex === "Female"
                                ? survived === "No"
                                  ? gray
                                  : color6[4]
                                : survived === "No"
                                ? gray
                                : color6[5],
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
