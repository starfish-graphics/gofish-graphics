const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

StackY(
  { direction: "y", spacing: 8, alignment: "middle", sharedScale: true },
  _(titanic)
    .groupBy("class")
    .map((cls) =>
      StackX(
        { spacing: 4, alignment: "end" },
        _(cls)
          .groupBy("sex")
          .map((sex) =>
            Enclose({}, [
              StackY(
                { spacing: 0.5, alignment: "end" },
                _(sex) // Was missing this lodash chain before .reverse()
                  .reverse()
                  .flatMap((d) => Array(d.count).fill(d))
                  .chunk(
                    Math.ceil(
                      (_(sex).sumBy("count") / _(cls).sumBy("count")) * 32
                    )
                  )
                  .reverse()
                  .map((d) =>
                    StackX(
                      { spacing: 0.5, alignment: "end" },
                      d.map((d) =>
                        Ellipse({
                          w: 4,
                          h: 4,
                          fill:
                            d.survived === "No"
                              ? gray
                              : /* value(d.class) */ classColor[d.class],
                        })
                      )
                    )
                  )
                  .value()
              ),
            ])
          )
          .value()
      )
    )
    .value()
).render(root, { w: 500, h: 340 });
