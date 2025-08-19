rect(seafood, { h: "count", fill: "species" })
  .stackY("species") // TODO: .stackY(v.species.orderBy("count"))
  .transform((d) => orderBy(d, "count", "desc"))
  .spreadX("lake", { spacing: 64 })
  .connectX("species", { over: "lake", opacity: 0.8 })
  .render(root, { w: 500, h: 300, axes: true });
