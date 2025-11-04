layer([
  chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64 }),
      stack("species", { dir: "y" })
    )
    .mark(scaffold({ h: "count", fill: "species" }))
    .as("bars"),
  chart(select("bars"))
    .flow(foreach("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 300,
  h: 400,
  axes: true,
});
