gf.Chart(seafood)
  .flow(
    gf.spread("lake", { spacing: 8, dir: "x" }),
    gf.derive((d) => d.flatMap((d) => gf.repeat(d, "count"))),
    gf.derive((d) => _.chunk(d, 5)),
    gf.spread({ spacing: 2, dir: "y" }),
    gf.spread({ spacing: 2, dir: "x" })
  )
  .mark(gf.rect({ w: 8, h: 8, fill: "species" }))
  .render(root, {
    w: 500,
    h: 300,
  });
