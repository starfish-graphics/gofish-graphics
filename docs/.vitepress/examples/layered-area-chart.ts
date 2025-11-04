layer([
  chart(streamgraphData)
    .flow(spread("x", { dir: "x", spacing: 50 }))
    .mark(scaffold({ h: "y", fill: "c" }))
    .as("points"),
  chart(select("points"))
    .flow(foreach("c"))
    .mark(area({ opacity: 0.7 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});