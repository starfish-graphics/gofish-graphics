guide(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .spreadX("lake", { alignment: "middle", spacing: 80 })
  .connectX("species", { over: "lake" })
  .render(root, { w: 500, h: 300, axes: true });
