gf.render(
  root,
  { w: 500, h: 300 },
  gf.frame(
    _(streamgraphData)
      .map((d) =>
        gf.ellipse({
          x: gf.value(d.x, "x"),
          y: gf.value(d.y, "y"),
          w: 16,
          h: 16,
          fill: gf.value(d.c, "color"),
        })
      )
      .value()
  )
);
