chart(seafood)
  .flow(
    spread("lake", { spacing: 8, dir: "x" }),
    derive((d) => d.flatMap((d) => repeat(d, "count"))),
    derive((d) => _.chunk(d, 5)),
    spread({ spacing: 2, dir: "y" }),
    spread({ spacing: 2, dir: "x" })
  )
  .mark(rect({ w: 8, h: 8, fill: "species" }))
  .render(root, {
    w: 500,
    h: 300,
  });
