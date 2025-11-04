chart(seafood)
  .flow(
    spread("lake", { dir: "x" }), //
    stack("species", { dir: "x" })
  )
  .mark(rect({ h: "count", fill: "species" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
  });
