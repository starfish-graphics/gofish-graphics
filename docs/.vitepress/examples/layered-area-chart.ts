Frame([
  ..._(streamgraphData)
    .groupBy("c")
    .flatMap((items, c) =>
      StackX(
        { spacing: 0, sharedScale: true },
        items.map((d) =>
          Rect({
            name: `${c}-${d.x}`,
            x: v(d.x),
            h: v(d.y),
            w: 0,
            fill: v(c),
          })
        )
      )
    )
    .value(),
  ..._(streamgraphData)
    .groupBy("c")
    .map((items, c) =>
      ConnectX(
        {
          interpolation: "linear",
          // opacity: 0.7,
          // mixBlendMode: "normal",
          opacity: 0.7,
        },
        items.map((d) => Ref(`${c}-${d.x}`))
      )
    )
    .value(),
]).render(root, { w: 500, h: 300 });
