rect(seafood, { h: "count", fill: "species" })
  .stackY("species", { reverse: true })
  .transform((d) => orderBy(d, "count", "desc"))
  .spreadX("lake", {
    y: 50,
    x: (-3 * Math.PI) / 6,
    spacing: (2 * Math.PI) / 6,
    alignment: "start",
    mode: "center",
  })
  .connectX("species", { over: "lake", opacity: 0.8 })
  .coord(polar())
  .render(root, { w: 500, h: 300, transform: { x: 200, y: 150 } });
