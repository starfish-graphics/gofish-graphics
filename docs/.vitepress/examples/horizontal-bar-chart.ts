chart(seafood)
  .flow(spread("lake", { dir: "y" }))
  .mark(rect({ w: "count" }))
  .render(root, {
    w: 400,
    h: 300,
    axes: true,
  });
