gf.Layer([
  gf.Chart(streamgraphData)
    .flow(gf.spread("x", { dir: "x", spacing: 50 }))
    .mark(gf.scaffold({ h: "y", fill: "c" }).name("points")),
  gf.Chart(gf.select("points"))
    .flow(gf.group("c"))
    .mark(gf.area({ opacity: 0.7 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
