layer([
  chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 80 }),
      spread("species", { dir: "y", spacing: -16 })
    )
    .mark(scaffold({ h: "count", fill: "species" }))
    .as("points"),
  chart(select("points"))
    .flow(foreach("species"))
    .mark(area({ opacity: 0.8, mixBlendMode: "normal" })),
]).render(root, { w: 500, h: 300, axes: true });