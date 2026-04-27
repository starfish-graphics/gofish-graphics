gf.Chart(seafood)
  .flow(
    gf.spread({ by: "lake", dir: "x" }), //
    gf.stack({ by: "species", dir: "x", label: false })
  )
  .mark(gf.rect({ h: "count", fill: "species" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
  });
