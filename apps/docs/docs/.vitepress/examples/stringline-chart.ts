const caltrainProcessed = caltrain.filter((d) => d.Type !== "Bullet");

gf.Frame({}, [
  gf.StackY(
    {
      spacing: 8,
      alignment: "start",
    },
    gf.For(
      gf.groupBy(
        _.orderBy(
          caltrainProcessed,
          (d) => caltrainStopOrder.indexOf(d.Station),
          "desc"
        ),
        "Station"
      ),
      (d, key) =>
        gf.Frame({ key }, [
          gf.Rect({ w: 0, h: 0 }),
          gf.For(d, (d) =>
            gf.Ellipse({ x: d.Time / 3, w: 4, h: 4, fill: gf.v(d.Direction) }).name(
              `${d.Train}-${d.Station}-${d.Time}`
            )
          ),
        ])
    )
  ),
  gf.For(gf.groupBy(caltrainProcessed, "Train"), (d) =>
    gf.ConnectY(
      { strokeWidth: 1, mode: "center-to-center" },
      gf.For(d, (d) => gf.Ref(`${d.Train}-${d.Station}-${d.Time}`))
    )
  ),
]).render(root, { w: 500, h: 400 });
