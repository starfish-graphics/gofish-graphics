rect(seafood, { w: "count", fill: "species" })
  .stackX("species", { y: 50, h: 50 })
  .coord(polar())
  .render(root, { w: 500, h: 300, transform: { x: 300, y: 200 } });

/* TODO: flipped w.r.t. pie chart b/c of y-offset bug */
