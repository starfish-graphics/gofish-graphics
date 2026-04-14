gf.Layer([
  gf
    .Chart(seafood)
    .flow(
      gf.spread("lake", { dir: "x", spacing: 80 }),
      gf.spread("species", { dir: "y", spacing: -16 })
    )
    .mark(gf.blank({ h: "count", fill: "species" }).name("points")),
  gf
    .Chart(gf.select("points"))
    .flow(gf.group("species"))
    .mark(gf.area({ opacity: 0.8, mixBlendMode: "normal" })),
]).render(root, { w: 500, h: 300, axes: true });
