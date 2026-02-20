const scatterData = Object.entries(gf.groupBy(seafood, "lake")).map(
  ([lake, lakeData]) => ({
    lake: lake,
    x: lakeLocations[lake].x,
    y: lakeLocations[lake].y,
    collection: lakeData.map((item) => ({
      species: item.species,
      count: item.count,
    })),
  })
);


gf.Chart(scatterData)
  .flow(gf.scatter("lake", { x: "x", y: "y" }))
  .mark((data) =>
    gf.Chart(data[0].collection, { coord: gf.clock() })
      .flow(gf.stack("species", { dir: "x", h: 20 }))
      .mark(gf.rect({ w: "count", fill: "species" }))
  )
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
