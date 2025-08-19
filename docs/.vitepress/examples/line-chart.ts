Frame([
  _(streamgraphData)
    .groupBy("c")
    .flatMap((items, c) =>
      items.map((d, i) =>
        Ellipse({
          name: `${c}-${i}`,
          x: v(d.x),
          y: v(d.y),
          w: 2,
          h: 2,
          fill: v(c),
        })
      )
    )
    .value(),
  _(streamgraphData)
    .groupBy("c")
    .map((items, c) =>
      ConnectX(
        {
          interpolation: "linear",
          // opacity: 0.7,
          mode: "center-to-center",
          strokeWidth: 3,
        },
        items.map((d) => Ref(`${c}-${d.x}`))
      )
    )
    .value(),
]).render(root, { w: 500, h: 300 });
