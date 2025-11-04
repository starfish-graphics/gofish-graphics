const catchLocationsArray = [
  { lake: "Lake A", x: 5.26, y: 22.64 },
  { lake: "Lake B", x: 30.87, y: 120.75 },
  { lake: "Lake C", x: 50.01, y: 60.94 },
  { lake: "Lake D", x: 115.13, y: 94.16 },
  { lake: "Lake E", x: 133.05, y: 50.44 },
  { lake: "Lake F", x: 85.99, y: 172.78 },
];

chart(catchLocationsArray)
  .flow(scatter("lake", { x: "x", y: "y" }))
  .mark(circle({ r: 5 }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
