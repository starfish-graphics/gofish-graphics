const colorMap = {
  0: color.red,
  1: color.blue,
  2: color.green,
  3: color.yellow,
  4: color.purple,
  5: color.orange,
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
  Frame(
    {
      x: options?.x - 15 * (options?.scale ?? 1),
      y: options?.y + 27 * (options?.scale ?? 1),
      box: true,
      transform: {
        scale: { x: options?.scale ?? 1, y: (options?.scale ?? 1) * -1 },
      },
    },
    [
      Ellipse({
        cx: 15,
        cy: 15,
        w: 24,
        h: 30,
        fill: (options?.color ?? color.red)[4],
      }),
      Ellipse({
        cx: 12,
        cy: 11,
        w: 7,
        h: 11,
        fill: (options?.color ?? color.red)[3],
      }),
      Rect({
        cx: 15,
        cy: 32,
        w: 8,
        h: 4,
        fill: (options?.color ?? color.red)[5],
        rx: 3,
        ry: 2,
      }),
      Rect({
        cx: 15,
        cy: 32,
        w: 5,
        h: 2.4,
        fill: (options?.color ?? color.red)[6],
        rx: 2,
        ry: 1,
      }),
    ]
  );

Frame(
  { coord: Wavy(), x: 0, y: 0 },
  scatterData.map((data, i) =>
    Frame({ x: data.x }, [
      Rect({
        x: 0,
        y: 0,
        // x: data.x,
        // y: data.y,
        w: 1,
        h: data.y,
        emY: true,
        fill: black,
      }),
      Balloon({
        scale: 1,
        x: 0,
        y: data.y,
        color: /* colorMap[i % 6] */ [
          null,
          null,
          null,
          mix(color6[i % 6], white, 0.5),
          color6[i % 6],
          mix(color6[i % 6], black, 0.1),
          mix(color6[i % 6], black, 0.35),
        ],
      }),
    ])
  )
).render(root, { w: 500, h: 300 });
