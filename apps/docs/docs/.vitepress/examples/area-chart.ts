// Aggregate total count per lake
const lakeTotals = Object.entries(groupBy(seafood, "lake")).map(
  ([lake, items]) => ({
    lake: lake,
    count: items.reduce((sum, item) => sum + item.count, 0),
  })
);

layer([
  chart(lakeTotals)
    .flow(spread("lake", { dir: "x", spacing: 64 }))
    .mark(scaffold({ h: "count" }))
    .as("points"),
  chart(select("points")).mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
