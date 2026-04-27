gf.frame({}, [
  gf.For(_.groupBy(newCarColors, "Year"), (d, key) =>
    gf.spread(
      { dir: "y", x: (key - 2000) * 30, spacing: 16, alignment: "start" },
      gf.For(_.sortBy(d, "Rank"), (d) =>
        gf
          .ellipse({ w: 8, h: 8, fill: gf.v(d.Color) })
          .name(`${d.Color}-${d.Year}`)
      )
    )
  ),
  gf.For(_.groupBy(newCarColors, "Color"), (d) =>
    gf.connectY(
      { strokeWidth: 2, mode: "center-to-center" },
      gf.For(d, (d) => gf.ref(`${d.Color}-${d.Year}`))
    )
  ),
]).render(root, { w: 500, h: 300 });
