Frame({}, [
  For(groupBy(newCarColors, "Year"), (d, key) =>
    StackY(
      {
        x: (key - 2000) * 30,
        spacing: 16,
        alignment: "start",
      },
      For(_.sortBy(d, "Rank"), (d) =>
        Ellipse({ w: 8, h: 8, fill: v(d.Color) }).name(`${d.Color}-${d.Year}`)
      )
    )
  ),
  For(groupBy(newCarColors, "Color"), (d) =>
    ConnectY(
      { strokeWidth: 2, mode: "center-to-center" },
      For(d, (d) => Ref(`${d.Color}-${d.Year}`))
    )
  ),
]).render(root, { w: 500, h: 300 });
