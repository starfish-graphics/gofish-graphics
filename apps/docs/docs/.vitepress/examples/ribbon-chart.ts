layer([
  chart(seafood)
    .flow(
      spread("lake", { dir: "x", spacing: 64 }),
      derive((d) => orderBy(d, "count")),
      stack("species", { dir: "y", label: false })
    )
    .mark(rect({ h: "count", fill: "species" }).name("bars")),
  chart(select("bars"))
    .flow(group("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 400,
  h: 400,
  axes: true,
});
