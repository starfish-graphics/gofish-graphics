const classColor = {
  First: gf.color6[0],
  Second: gf.color6[1],
  Third: gf.color6[2],
  Crew: gf.color6[3],
};

gf.StackY(
  { direction: "y", spacing: 8, alignment: "middle", sharedScale: true },
  _(titanic)
    .groupBy("class")
    .map((cls) =>
      gf.StackX(
        { spacing: 4, alignment: "end" },
        _(cls)
          .groupBy("sex")
          .map((sex) =>
            gf.Enclose({}, [
              gf.StackY(
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
                    gf.StackX(
                      { spacing: 0.5, alignment: "end" },
                      d.map((d) =>
                        gf.Ellipse({
                          w: 4,
                          h: 4,
                          fill:
                            d.survived === "No"
                              ? gf.gray
                              : /* gf.value(d.class) */ classColor[d.class],
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
