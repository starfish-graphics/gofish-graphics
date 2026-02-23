const scatterData = _(seafood)
  .groupBy("lake")
  .map((lakeData, lake) => ({
    lake,
    x: lakeLocations[lake].x,
    y: lakeLocations[lake].y,
    collection: lakeData.map((item) => ({
      species: item.species,
      count: item.count,
    })),
  }))
  .value();

gf.Frame(
  gf.For(scatterData, (sample) =>
    gf.Frame({ x: sample.x, y: sample.y }, [
      gf.Rect({
        w: 2,
        h: 300 - sample.y,
        fill: gf.color.green[5],
      }),
      gf.Frame(
        {
          coord: gf.polar(),
        },
        [
          gf.StackX(
            {
              h: _(sample.collection).sumBy("count") / 7,
              spacing: 0,
              alignment: "start",
              sharedScale: true,
            },
            gf.For(sample.collection, (d, i) =>
              gf.Petal({
                w: gf.v(d.count),
                fill: mix(gf.color6[i % 6], gf.white, 0.5),
              })
            )
          ),
        ]
      ),
    ])
  )
).render(root, { w: 500, h: 300 });
