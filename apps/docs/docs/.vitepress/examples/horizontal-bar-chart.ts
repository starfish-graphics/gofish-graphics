gf.Chart(seafood)
  .flow(gf.spread("lake", { dir: "y" }))
  .mark(gf.rect({ w: "count" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
  });
