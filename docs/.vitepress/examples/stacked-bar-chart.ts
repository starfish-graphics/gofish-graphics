chart(seafood)
  .flow(
    spread("lake", { dir: "x" }), //
    stack("species", { dir: "y", label: false })
  )
  .mark(rect({ h: "count", fill: "species" }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
