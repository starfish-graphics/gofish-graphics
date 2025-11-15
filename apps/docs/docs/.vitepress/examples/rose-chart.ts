chart(nightingale, { coord: clock() })
  .flow(
    stack("Month", { dir: "x" }),
    stack("Type", { dir: "y" }),
    derive((d) => d.map((d) => ({ ...d, Death: Math.sqrt(d.Death) })))
  )
  .mark(rect({ w: (Math.PI * 2) / 12, emX: true, h: "Death", fill: "Type" }))
  .render(root, {
    w: 400,
    h: 400,
    transform: { x: 200, y: 200 },
  });
