gf.Chart(seafood)
  .flow(
    gf.spread({ by: "lake", dir: "x" }), //
    gf.stack({ by: "species", dir: "y", label: false })
  )
  .mark(gf.rect({ h: "count", fill: "species" }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
