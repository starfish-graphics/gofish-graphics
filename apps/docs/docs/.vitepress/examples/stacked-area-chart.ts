Layer([
  Chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64 }),
      stack("species", { dir: "y", label: false })
    )
    .mark(scaffold({ h: "count", fill: "species" }).name("bars")),
  Chart(select("bars"))
    .flow(group("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 300,
  h: 400,
  axes: true,
});
