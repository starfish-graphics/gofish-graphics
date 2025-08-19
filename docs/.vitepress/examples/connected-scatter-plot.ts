Frame({}, [
  For(drivingShifts, (d) =>
    Ellipse({
      x: v(d.miles),
      y: v(d.gas),
      w: 6,
      h: 6,
      fill: "white",
      stroke: "black",
      strokeWidth: 2,
    }).name(`${d.year}`)
  ),
  ConnectX(
    {
      interpolation: "linear",
      stroke: "black",
      strokeWidth: 2,
      mode: "center-to-center",
    },
    For(drivingShifts, (d) => Ref(`${d.year}`))
  ),
  For(drivingShifts, (d) =>
    Ellipse({
      x: v(d.miles),
      y: v(d.gas),
      w: 6,
      h: 6,
      fill: "white",
      stroke: "black",
      strokeWidth: 2,
    })
  ),
]).render(root, { w: 500, h: 300 });
