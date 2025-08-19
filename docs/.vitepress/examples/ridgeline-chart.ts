guide(seafood, { h: "count", fill: "species" })
  .spreadX("lake", { spacing: 80 })
  .connectX("lake", { mixBlendMode: "normal" })
  .spreadY("species", { spacing: -16 })
  .render(root, { w: 500, h: 300, axes: true });
