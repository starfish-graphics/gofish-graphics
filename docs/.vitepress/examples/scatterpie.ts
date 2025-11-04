const scatterData = Object.entries(groupBy(seafood, "lake")).map(
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


chart(scatterData)
  .flow(scatter("lake", { x: "x", y: "y" }))
  .mark((data) =>
    chart(data[0].collection, { coord: clock() })
      .flow(stack("species", { dir: "x", h: 20 }))
      .mark(rect({ w: "count", fill: "species" }))
  )
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
