layer({ coord: clock() }, [
  chart(seafood)
    .flow(
      spread("lake", {
        dir: "x",
        spacing: (2 * Math.PI) / 6,
        mode: "center",
        y: 50,
        label: false,
      }),
      derive((d) => orderBy(d, "count")),
      stack("species", { dir: "y", label: false })
    )
    .mark(rect({ h: "count", fill: "species" }).name("bars")),
  chart(select("bars"))
    .flow(group("species"))
    .mark(area({ opacity: 0.8 })),
]).render(root, {
  w: 500,
  h: 300,
  transform: { x: 200, y: 200 },
  axes: true,
});
