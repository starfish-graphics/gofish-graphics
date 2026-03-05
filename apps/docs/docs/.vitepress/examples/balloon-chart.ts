const colorMap = {
  0: gf.color.red,
  1: gf.color.blue,
  2: gf.color.green,
  3: gf.color.yellow,
  4: gf.color.purple,
  5: gf.color.orange,
};

const scatterData = _(seafood)
  .groupBy("lake")
  .map((lakeData, lake) => ({
    lake,
    x: lakeLocations[lake].x,
    y: lakeLocations[lake].y,
    collection: lakeData.map((item) => ({
      species: item.species,
      count: item.count,
    })),
  }))
  .value();

const Balloon = (options) =>
  gf.Frame(
    {
      x: options?.x - 15 * (options?.scale ?? 1),
      y: options?.y + 27 * (options?.scale ?? 1),
      box: true,
      transform: {
        scale: { x: options?.scale ?? 1, y: (options?.scale ?? 1) * -1 },
      },
    },
    [
      gf.ellipse({
        cx: 15,
        cy: 15,
        w: 24,
        h: 30,
        fill: (options?.color ?? gf.color.red)[4],
      }),
      gf.ellipse({
        cx: 12,
        cy: 11,
        w: 7,
        h: 11,
        fill: (options?.color ?? gf.color.red)[3],
      }),
      gf.rect({
        cx: 15,
        cy: 32,
        w: 8,
        h: 4,
        fill: (options?.color ?? gf.color.red)[5],
        rx: 3,
        ry: 2,
      }),
      gf.rect({
        cx: 15,
        cy: 32,
        w: 5,
        h: 2.4,
        fill: (options?.color ?? gf.color.red)[6],
        rx: 2,
        ry: 1,
      }),
    ]
  );

gf.Frame(
  { coord: gf.wavy(), x: 0, y: 0 },
  scatterData.map((data, i) =>
    gf.Frame({ x: data.x }, [
      gf.rect({
        x: 0,
        y: 0,
        // x: data.x,
        // y: data.y,
        w: 1,
        h: data.y,
        emY: true,
        fill: gf.black,
      }),
      Balloon({
        scale: 1,
        x: 0,
        y: data.y,
        color: /* colorMap[i % 6] */ [
          null,
          null,
          null,
          mix(gf.color6[i % 6], gf.white, 0.5),
          gf.color6[i % 6],
          mix(gf.color6[i % 6], gf.black, 0.1),
          mix(gf.color6[i % 6], gf.black, 0.35),
        ],
      }),
    ])
  )
).render(root, { w: 500, h: 300 });
