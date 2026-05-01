gf.layer([
  gf
    .Chart(streamgraphData)
    .flow(gf.spread({ by: "x", dir: "x", spacing: 50 }))
    .mark(gf.blank({ h: "y", fill: "c" }).name("points")),
  gf
    .Chart(gf.select("points"))
    .flow(gf.group({ by: "c" }))
    .mark(gf.area({ opacity: 0.7 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
