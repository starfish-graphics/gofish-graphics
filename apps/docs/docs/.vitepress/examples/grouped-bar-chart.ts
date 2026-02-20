gf.Chart(seafood)
  .flow(
    gf.spread("lake", { dir: "x" }), //
    gf.stack("species", { dir: "x", label: false })
  )
  .mark(gf.rect({ h: "count", fill: "species" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
  });
