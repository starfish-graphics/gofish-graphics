const data = [
  { origin: "Europe", cylinders: "4", count: 66 },
  { origin: "Europe", cylinders: "5", count: 3 },
  { origin: "Europe", cylinders: "6", count: 4 },
  { origin: "Japan", cylinders: "3", count: 4 },
  { origin: "Japan", cylinders: "4", count: 69 },
  { origin: "Japan", cylinders: "6", count: 6 },
  { origin: "USA", cylinders: "4", count: 72 },
  { origin: "USA", cylinders: "6", count: 74 },
  { origin: "USA", cylinders: "8", count: 108 },
];

chart(data)
  .flow(
    spread("origin", { dir: "x" }),
    derive((d) => normalize(d, "count")),
    stack("cylinders", { dir: "y" })
  )
  .mark(rect({ h: "count", fill: "origin", stroke: "white", strokeWidth: 2 }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });