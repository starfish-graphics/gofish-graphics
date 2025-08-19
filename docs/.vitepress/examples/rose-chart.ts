Frame({ coord: Polar() }, [
  StackX(
    { x: -Math.PI / 2, spacing: 0, alignment: "start", sharedScale: true },
    For(groupBy(nightingale, "Month"), (d, i) =>
      StackY(
        { spacing: 0 },
        For(d, (d) =>
          Rect({
            h: v(Math.sqrt(d.Death)),
            w: (Math.PI * 2) / 12,
            emX: true,
            fill: v(d.Type),
          })
        )
      )
    )
  ),
]).render(root, { w: 500, h: 500, x: 200, y: 300 });

/* rect(seafood, { h: "Death", fill: "Type" }) // TODO: use sqrt scale here?
  .stackY("Type")
  .stackX("Month", { x: -Math.PI / 2 }) // TODO: use r, theta as alternatives?
  .coord(polar())
  .render(root, { w: 500, h: 300, axes: true }); */
