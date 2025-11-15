chart(seafood)
  .flow(spread("lake", { dir: "x" }))
  .mark(rect({ h: "count" }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });
