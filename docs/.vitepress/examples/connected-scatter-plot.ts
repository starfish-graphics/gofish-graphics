layer([
  chart(drivingShifts)
    .flow(scatter("year", { x: "miles", y: "gas" }))
    .mark(circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 }))
    .as("points"),
  chart(select("points")).mark(line({ stroke: "black", strokeWidth: 2 })),
  chart(drivingShifts)
    .flow(scatter("year", { x: "miles", y: "gas" }))
    .mark(circle({ r: 4, fill: "white", stroke: "black", strokeWidth: 2 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
