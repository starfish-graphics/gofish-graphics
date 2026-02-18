const catchLocationsArray = Object.entries(lakeLocations).map(
  ([lake, { x, y }]) => ({ lake, x, y })
);

Layer([
  Chart(catchLocationsArray)
    .flow(scatter("lake", { x: "x", y: "y" }))
    .mark(scaffold().name("points")),
  Chart(select("points")).mark(line()),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
