gf.Chart(nightingale, { coord: gf.clock() })
  .flow(
    gf.stack({ by: "Month", dir: "x" }),
    gf.stack({ by: "Type", dir: "y" }),
    gf.derive((d) => d.map((d) => ({ ...d, Death: Math.sqrt(d.Death) })))
  )
  .mark(gf.rect({ w: (Math.PI * 2) / 12, emX: true, h: "Death", fill: "Type" }))
  .render(root, {
    w: 400,
    h: 400,
    transform: { x: 200, y: 200 },
  });
