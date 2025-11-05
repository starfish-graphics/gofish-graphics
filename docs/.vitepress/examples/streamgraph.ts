layer([
  chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64, alignment: "middle" }),
      stack("species", { dir: "y", label: false })
    )
    .mark(scaffold({ h: "count", fill: "species" }))
    .as("bars"),
  chart(select("bars"))
    .flow(group("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 500,
  h: 300,
  axes: true,
});
