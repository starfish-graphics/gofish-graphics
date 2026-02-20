gf.Chart(seafood, { coord: gf.clock() })
  .flow(gf.stack("species", { dir: "x" }))
  .mark(gf.rect({ w: "count", fill: "species" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
    transform: { x: 200, y: 200 },
  });
