gf.Layer([
  gf.Chart(seafood)
    .flow(
      gf.spread("lake", { dir: "x", spacing: 64 }),
      gf.stack("species", { dir: "y", label: false })
    )
    .mark(gf.scaffold({ h: "count", fill: "species" }).name("bars")),
  gf.Chart(gf.select("bars"))
    .flow(gf.group("species"))
    .mark(gf.area({ opacity: 0.8 })),
]).render(root, {
  w: 300,
  h: 400,
  axes: true,
});
