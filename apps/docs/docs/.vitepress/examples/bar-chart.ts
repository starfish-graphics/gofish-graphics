gf.Chart(seafood)
  .flow(gf.spread("lake", { dir: "x" }))
  .mark(gf.rect({ h: "count" }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
