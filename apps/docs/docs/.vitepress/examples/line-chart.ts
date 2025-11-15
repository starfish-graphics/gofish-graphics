const catchLocationsArray = Object.entries(lakeLocations).map(
  ([lake, { x, y }]) => ({ lake, x, y })
);

layer([
  chart(catchLocationsArray)
    .flow(scatter("lake", { x: "x", y: "y" }))
    .mark(scaffold())
    .as("points"),
  chart(select("points")).mark(line()),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
