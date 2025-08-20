guide(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .spreadX("lake", { spacing: 80 }) // TODO: automatically infer this spacing
  .connectX("species", { over: "lake" })
  .render(root, { w: 500, h: 300, axes: true });
