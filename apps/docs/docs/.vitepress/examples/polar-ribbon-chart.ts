gf.Layer({ coord: gf.clock() }, [
  gf.Chart(seafood)
    .flow(
      gf.spread("lake", {
        dir: "x",
        spacing: (2 * Math.PI) / 6,
        mode: "center",
        y: 50,
        label: false,
      }),
      gf.derive((d) => gf.orderBy(d, "count")),
      gf.stack("species", { dir: "y", label: false })
    )
    .mark(gf.rect({ h: "count", fill: "species" }).name("bars")),
  gf.Chart(gf.select("bars"))
    .flow(gf.group("species"))
    .mark(gf.area({ opacity: 0.8 })),
]).render(root, {
  w: 500,
  h: 300,
  transform: { x: 200, y: 200 },
  axes: true,
});
