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

Frame(
  For(scatterData, (sample) =>
    Frame({ x: sample.x, y: sample.y }, [
      Rect({
        w: 2,
        h: 300 - sample.y,
        fill: color.green[5],
      }),
      Frame(
        {
          coord: Polar(),
        },
        [
          StackX(
            {
              h: _(sample.collection).sumBy("count") / 7,
              spacing: 0,
              alignment: "start",
              sharedScale: true,
            },
            For(sample.collection, (d, i) =>
              Petal({
                w: v(d.count),
                fill: mix(color6[i % 6], white, 0.5),
              })
            )
          ),
        ]
      ),
    ])
  )
).render(root, { w: 500, h: 300 });
