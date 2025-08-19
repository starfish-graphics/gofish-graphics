guide(seafood, { h: "count", fill: "species" })
  .spreadX("lake", { spacing: 80 })
  .connectX("lake")
  .render(root, { w: 500, h: 300, axes: true });
