const caltrainProcessed = caltrain.filter((d) => d.Type !== "Bullet");

gf.frame({}, [
  gf.stackY(
    {
      spacing: 8,
      alignment: "start",
    },
    gf.For(
      _.groupBy(
        _.orderBy(
          caltrainProcessed,
          (d) => caltrainStopOrder.indexOf(d.Station),
          "desc"
        ),
        "Station"
      ),
      (d, key) =>
        gf.frame({ key }, [
          gf.rect({ w: 0, h: 0 }),
          gf.For(d, (d) =>
            gf
              .ellipse({ x: d.Time / 3, w: 4, h: 4, fill: gf.v(d.Direction) })
              .name(`${d.Train}-${d.Station}-${d.Time}`)
          ),
        ])
    )
  ),
  gf.For(_.groupBy(caltrainProcessed, "Train"), (d) =>
    gf.connectY(
      { strokeWidth: 1, mode: "center-to-center" },
      gf.For(d, (d) => gf.ref(`${d.Train}-${d.Station}-${d.Time}`))
    )
  ),
]).render(root, { w: 500, h: 400 });
