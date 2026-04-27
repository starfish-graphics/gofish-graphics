gf.Layer([
  gf
    .Chart(seafood)
    .flow(
      gf.spread({ by: "lake", dir: "x", spacing: 64, alignment: "middle" }),
      gf.stack({ by: "species", dir: "y", label: false })
    )
    .mark(gf.blank({ h: "count", fill: "species" }).name("bars")),
  gf
    .Chart(gf.select("bars"))
    .flow(gf.group({ by: "species" }))
    .mark(gf.area({ opacity: 0.8 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
