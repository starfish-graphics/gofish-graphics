chart(seafood, { coord: clock() })
  .flow(stack("species", { dir: "x" }))
  .mark(rect({ w: "count", fill: "species" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
    transform: { x: 200, y: 200 },
  });
