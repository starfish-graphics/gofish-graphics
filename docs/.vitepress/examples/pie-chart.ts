rect(seafood, { w: "count", fill: "species" })
  .stackX("species")
  .coord(polar())
  .render(root, { w: 500, h: 300, transform: { x: 300 } });
