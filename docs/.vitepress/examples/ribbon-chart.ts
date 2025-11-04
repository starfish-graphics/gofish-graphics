layer([
  chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64 }),
      derive((d) => orderBy(d, "count", "asc")),
      stack("species", { dir: "y" })
    )
    .mark(rect({ h: "count", fill: "species" }))
    .as("bars"),
  chart(select("bars"))
    .flow(foreach("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 400,
  h: 400,
  axes: true,
});
