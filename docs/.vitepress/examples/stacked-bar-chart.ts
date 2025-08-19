rect(seafood, { h: "count", fill: "species" })
  .stackY("species")
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
