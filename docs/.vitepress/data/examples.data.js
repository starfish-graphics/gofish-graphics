export default {
  load() {
    const examples = [
      {
        id: "bar-chart",
        title: "Bar Chart",
        // description: "A simple bar chart",
        demoUrl: "/examples/bar-chart",
        code: `const alphabet = [
  { letter: "A", frequency: 28 },
  { letter: "B", frequency: 55 },
  { letter: "C", frequency: 43 },
  { letter: "D", frequency: 95 },
  { letter: "E", frequency: 81 },
  { letter: "F", frequency: 53 },
  { letter: "G", frequency: 19 },
  { letter: "H", frequency: 87 },
  { letter: "I", frequency: 52 },
];

StackX(
  { spacing: 4, alignment: "end", sharedScale: true },
  For(alphabet, (d) => Rect({ w: 30, h: v(d.frequency) }))
).render(root, { width: size.width, height: size.height, axes: true });`,
      },
      {
        id: "horizontal-bar-chart",
        title: "Horizontal Bar Chart",
        // description: "A simple horizontal bar chart",
        demoUrl: "/examples/horizontal-bar-chart",
        code: `const data = [
  { a: "A", b: 28 },
  { a: "B", b: 55 },
  { a: "C", b: 43 },
  { a: "D", b: 95 },
  { a: "E", b: 81 },
  { a: "F", b: 53 },
  { a: "G", b: 19 },
  { a: "H", b: 87 },
  { a: "I", b: 52 },
];

gf.stackY(
    { spacing: 4, alignment: "start", sharedScale: true },
    gf.map(data, (d) => gf.rect({ w: gf.value(d.b, "value"), h: 30 }))
  ).render(root, { width: size.width, height: size.height });
`,
      },
      {
        id: "stacked-bar-chart",
        title: "Stacked Bar Chart",
        // description: "A simple stacked bar chart",
        demoUrl: "/examples/stacked-bar-chart",
        code: `StackX({ spacing: 8, sharedScale: true },
  For(groupBy(catchData, "lake"), (lake, key) =>
    StackY({ key, spacing: 0 },
      For(lake, (d) =>
        Rect({ w: 32, h: v(d.count), fill: v(d.species) }))))
).render(root, { width: size.width, height: size.height, axes: true });
`,
      },
      {
        id: "grouped-bar-chart",
        title: "Grouped Bar Chart",
        description: "Horizontally stacked vertical bars",
        demoUrl: "/examples/grouped-bar-chart",
        code: `StackX({ spacing: 16, sharedScale: true },
  For(groupBy(catchData, "lake"), (lake, key) =>
    StackX({ key, spacing: 1 },
      For(lake, (d) =>
        Rect({ w: 12, h: v(d.count), fill: v(d.species) })))),
).render(root, { width: size.width, height: size.height, axes: true });`,
      },
      {
        id: "streamgraph",
        title: "Streamgraph",
        description: "A center-aligned stacked area chart",
        demoUrl: "/examples/streamgraph",
        code: `Frame([
  StackX(
    {
      spacing: 0,
      alignment: "middle",
      sharedScale: true,
    },
    For(groupBy(streamgraphData, "x"), (items, xCoord) =>
      StackY(
        { spacing: 0, x: v(xCoord) },
        For(items, (d) =>
          Rect({
            h: v(d.y),
            w: 0,
            fill: v(d.c),
          }).name(\`\${xCoord}-\${d.c}\`)
        )
      )
    )
  ),
  For(groupBy(streamgraphData, "c"), (items, c) =>
    ConnectX(
      {
        mixBlendMode: "normal",
        strokeWidth: 1,
      },
      For(items, (d) => Ref(\`\${d.x}-\${d.c}\`))
    )
  ),
]).render(root, { width: size.width, height: size.height });`,
      },
      {
        id: "stacked-area-chart",
        title: "Stacked Area Chart",
        // description: "A stacked area chart",
        demoUrl: "/examples/stacked-area-chart",
        code: `Frame([
    StackX(
      {
        spacing: 0,
        sharedScale: true,
      },
      For(_(streamgraphData).groupBy("x"), (items, xCoord) =>
        StackY(
          { spacing: 0, x: v(xCoord) },
          For(items, (d) =>
            Rect({
              name: \`\${xCoord}-\${d.c}\`,
              h: v(d.y),
              w: 0,
              fill: v(d.c),
            })
          )
        )
      )
    ),
    ...For(_(streamgraphData).groupBy("c"), (items, c) =>
        ConnectX(
          {
            mixBlendMode: "normal",
            strokeWidth: 1,
          },
          For(items, (d) => Ref(\`\${d.x}-\${d.c}\`))
        )
      ),
  ]).render(root, { width: size.width, height: size.height, axes: true });`,
      },
      {
        id: "ridgeline-chart",
        title: "Ridgeline Chart",
        description: "A faceted area chart",
        demoUrl: "/examples/ridgeline-chart",
        code: `StackY(
    { spacing: -30, sharedScale: true },
    For(groupBy(streamgraphData, "c"), (items, c) =>
      Frame([
        StackX(
          { spacing: 60 },
          For(items, (d) =>
            Rect({
              h: d.y,
              w: 0,
              fill: v(d.c),
            }).name(\`\${d.c}-\${d.x}\`)
          )
        ),
        ConnectX({ mixBlendMode: "normal" },
          For(items, (d) => Ref(\`\${d.c}-\${d.x}\`))
        ),
      ])
    )
  ).render(root, { width: size.width, height: size.height });`,
      },
      {
        id: "area-chart",
        title: "Area Chart",
        demoUrl: "/examples/area-chart",
        code: `const data = streamgraphData.filter((d) => d.c === 1);
      
Frame([
  StackX({ spacing: 60 },
    For(data, (d) => Rect({ h: d.y * 5, w: 0, fill: v(d.c) }).name(\`\${d.x}\`))
  ),
  ConnectX({},
    For(data, (d) => Ref(\`\${d.x}\`))
  ),
]).render(root, { width: size.width, height: size.height });`,
      },
      {
        id: "line-chart",
        title: "Line Chart",
        demoUrl: "/examples/line-chart",
        code: `gf.frame([
    ..._(streamgraphData)
      .groupBy("c")
      .flatMap((items, c) =>
        items.map((d, i) =>
          gf.ellipse({
            name: \`\${c}-\${i}\`,
            x: gf.value(d.x, "x"),
            y: gf.value(d.y, "y"),
            w: 2,
            h: 2,
            fill: gf.value(c, "color"),
          })
        )
      )
      .value(),
    ..._(streamgraphData)
      .groupBy("c")
      .map((items, c) =>
        gf.connectX(
          {
            interpolation: "linear",
            // opacity: 0.7,
            mode: "center-to-center",
            strokeWidth: 3,
          },
          items.map((d) => gf.ref(\`\${c}-\${d.x}\`))
        )
      )
      .value(),
  ]).render(root, { width: size.width, height: size.height });
`,
      },
      {
        id: "scatter-plot",
        title: "Scatter Plot",
        demoUrl: "/examples/scatter-plot",
        code: `gf.render(
  root,
  { width: size.width, height: size.height },
  gf.frame(
    _(streamgraphData)
      .map((d) =>
        gf.ellipse({
          x: gf.value(d.x, "x"),
          y: gf.value(d.y, "y"),
          w: 16,
          h: 16,
          fill: gf.value(d.c, "color"),
        })
      )
      .value()
  )
);
`,
      },
      {
        id: "pie-chart",
        title: "Pie Chart",
        demoUrl: "/examples/pie-chart",
        code: `const data = [
  { category: 1, value: 4 },
  { category: 2, value: 6 },
  { category: 3, value: 10 },
  { category: 4, value: 3 },
  { category: 5, value: 7 },
  { category: 6, value: 8 },
];

const color6 = ["#000000", "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

        gf.render(
  root,
  { width: size.width, height: size.height, transform: { x: 300, y: 200 } },
  gf.coord({ transform: gf.polar_DEPRECATED() }, [
      gf.stack(
        { x: 0, direction: 1, spacing: 0, alignment: "start" },
        data.map((d, i) =>
          gf.rect({
            w: 100,
            h: /* value(d.b, "value") */ d.value / 6.05,
            emY: true,
            fill: color6[i % 6],
          })
        )
      ),
    ])
);
`,
      },
      {
        id: "donut-chart",
        title: "Donut Chart",
        description: "A pie with a hole in the middle",
        demoUrl: "/examples/donut-chart",
        code: `const data = [
  { category: 1, value: 4 },
  { category: 2, value: 6 },
  { category: 3, value: 10 },
  { category: 4, value: 3 },
  { category: 5, value: 7 },
  { category: 6, value: 8 },
];

const color6 = ["#000000", "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

        gf.render(
  root,
  { width: size.width, height: size.height, transform: { x: 300, y: 200 } },
  gf.coord({ transform: gf.polar_DEPRECATED() }, [
      gf.stack(
        { x: 50, direction: 1, spacing: 0, alignment: "start" },
        data.map((d, i) =>
          gf.rect({
            w: 50,
            h: /* value(d.b, "value") */ d.value / 6.05,
            emY: true,
            fill: color6[i % 6],
          })
        )
      ),
    ])
);
`,
      },
      {
        id: "mosaic-plot",
        title: "Mosaic Plot",
        demoUrl: "/examples/mosaic-plot",
        code: `const data = [
  { origin: "Europe", cylinders: "4", count: 66 },
  { origin: "Europe", cylinders: "5", count: 3 },
  { origin: "Europe", cylinders: "6", count: 4 },
  { origin: "Japan", cylinders: "3", count: 4 },
  { origin: "Japan", cylinders: "4", count: 69 },
  { origin: "Japan", cylinders: "6", count: 6 },
  { origin: "USA", cylinders: "4", count: 72 },
  { origin: "USA", cylinders: "6", count: 74 },
  { origin: "USA", cylinders: "8", count: 108 },
];

  StackX(
      { spacing: 4, alignment: "end" },
      // TODO: I could probably make the width be uniform flexible basically
      For(groupBy(data, "origin"), (items, origin) =>
        StackY(
          { w: _(items).sumBy("count") / 2, spacing: 2, alignment: "middle", sharedScale: true },
          For(items.toReversed(), (d) =>
            Rect({
              h: v(d.count),
              fill: d.origin === "Europe" ? gf.color.red[5] : d.origin === "Japan" ? gf.color.blue[5] : gf.color.green[5],
            })
          )
        )
      )
    ).render(root, { width: size.width, height: size.height });
        `,
      },
      {
        id: "nested-mosaic-plot",
        title: "Nested Mosaic Plot",
        demoUrl: "/examples/nested-mosaic-plot",
        code: `const classColor = {
  First: gf.color.red[5],
  Second: gf.color.blue[5],
  Third: gf.color.green[5],
  Crew: gf.color.orange[5],
};

StackY(
  { spacing: 4, alignment: "middle" },
  For(groupBy(titanic, "class"), (items, cls) =>
    StackX(
      { h: _(items).sumBy("count") / 10, spacing: 2, alignment: "middle" },
      For(groupBy(items, "sex"), (sItems, sex) =>
        StackY(
          {
            w: (_(sItems).sumBy("count") / _(items).sumBy("count")) * 100,
            spacing: 0,
            alignment: "middle",
            sharedScale: true,
          },
          For(groupBy(sItems, "survived"), (items, survived) =>
            Rect({
              h: v(_(items).sumBy("count")),
              fill: survived === "No" ? gf.black : classColor[cls],
            }),
          ),
        ),
      ),
    ),
  ),
).render(root, { width: size.width, height: size.height });`,
      },
      {
        id: "ribbon-chart",
        title: "Ribbon Chart",
        demoUrl: "/examples/ribbon-chart",
        description:
          "A hybrid between a stacked bar chart and a stacked area chart",
        code: `Frame([
  StackX({ spacing: 64, sharedScale: true },
    For(_(catchData).groupBy("lake"), (d) =>
      StackY({ spacing: 2 },
        For(_(d).orderBy("count", "desc"), (d) =>
          Rect({ name: \`\${d.lake}-\${d.species}\`, w: 16, h: v(d.count), fill: v(d.species) }))))),
    ...For(_(catchData).groupBy("species"), (items) =>
      ConnectX({ opacity: 0.8 },
        For(items, (d) => Ref(\`\${d.lake}-\${d.species}\`)))),
  ]).render(root, { width: size.width, height: size.height });`,
      },
    ];

    return {
      examples,
      getCodeById(id) {
        const example = examples.find((ex) => ex.id === id);
        return example ? example.code : null;
      },
    };
  },
};
