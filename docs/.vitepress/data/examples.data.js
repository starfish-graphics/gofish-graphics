export default {
  load() {
    const examples = [
      {
        id: "bar-chart",
        title: "Bar Chart",
        // description: "A simple bar chart",
        demoUrl: "/examples/bar-chart",
        code: `const data = [
  { a: "A", b: 28 },
  { a: "B", b: 55 },
  { a: "C", b: 43 },
  { a: "D", b: 91 },
  { a: "E", b: 81 },
  { a: "F", b: 53 },
  { a: "G", b: 19 },
  { a: "H", b: 87 },
  { a: "I", b: 52 },
];

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackX(
    { spacing: 4, alignment: "end", sharedScale: true },
    data.map((d) => gf.rect({ w: 30, h: gf.value(d.b, "value") }))
  )
);
`,
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
  { a: "D", b: 91 },
  { a: "E", b: 81 },
  { a: "F", b: 53 },
  { a: "G", b: 19 },
  { a: "H", b: 87 },
  { a: "I", b: 52 },
];

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackY(
    { spacing: 4, alignment: "start", sharedScale: true },
    data.map((d) => gf.rect({ w: gf.value(d.b, "value"), h: 30 }))
  )
);
`,
      },
      {
        id: "stacked-bar-chart",
        title: "Stacked Bar Chart",
        // description: "A simple stacked bar chart",
        demoUrl: "/examples/stacked-bar-chart",
        code: `gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackX(
    { spacing: 8, sharedScale: true },
    _(catchData)
      .groupBy("lake")
      .map((d) =>
        gf.stackY(
          { spacing: 2 },
          d.map((d) => gf.rect({ w: 32, h: gf.value(d.count, "value"), fill: gf.value(d.species, "color") }))
        )
      )
      .value()
  )
);
`,
      },
      {
        id: "grouped-bar-chart",
        title: "Grouped Bar Chart",
        // description: "A simple grouped bar chart",
        demoUrl: "/examples/grouped-bar-chart",
        code: `gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stackX(
    { spacing: 20, sharedScale: true },
    _(catchData)
      .groupBy("lake")
      .map((d) =>
        gf.stackX(
          { spacing: 1 },
          d.map((d) => gf.rect({ w: 16, h: gf.value(d.count, "value"), fill: gf.value(d.species, "color") }))
        )
      )
      .value()
  )
);
`,
      },
      {
        id: "streamgraph",
        title: "Streamgraph",
        description: "A center-aligned stacked area chart",
        demoUrl: "/examples/streamgraph",
        code: `gf.render(
  root,
  { width: size.width, height: size.height },
  gf.frame([
    gf.stackX(
      {
        spacing: 0,
        alignment: "middle",
        sharedScale: true,
      },
      [
        ..._(streamgraphData)
          .groupBy("x")
          .map((items, xCoord) =>
            gf.stackY(
              { spacing: 0, x: gf.value(xCoord, "x") },
              items.map((d) =>
                gf.rect({
                  name: \`\${xCoord}-\${d.c}\`,
                  h: gf.value(d.y, "value"),
                  w: 0,
                  fill: gf.value(d.c, "color"),
                })
              )
            )
          )
          .value(),
      ]
    ),
    ..._(streamgraphData)
      .groupBy("c")
      .map((items, c) =>
        gf.connectX(
          {
            mixBlendMode: "normal",
            strokeWidth: 1,
          },
          items.map((d) => gf.ref(\`\${d.x}-\${d.c}\`))
        )
      )
      .value(),
  ])
);
`,
      },
      {
        id: "stacked-area-chart",
        title: "Stacked Area Chart",
        // description: "A stacked area chart",
        demoUrl: "/examples/stacked-area-chart",
        code: `gf.render(
  root,
  { width: size.width, height: size.height },
  gf.frame([
    gf.stackX(
      {
        spacing: 0,
        sharedScale: true,
      },
      [
        ..._(streamgraphData)
          .groupBy("x")
          .map((items, xCoord) =>
            gf.stackY(
              { spacing: 0, x: gf.value(xCoord, "x") },
              items.map((d) =>
                gf.rect({
                  name: \`\${xCoord}-\${d.c}\`,
                  h: gf.value(d.y, "value"),
                  w: 0,
                  fill: gf.value(d.c, "color"),
                })
              )
            )
          )
          .value(),
      ]
    ),
    ..._(streamgraphData)
      .groupBy("c")
      .map((items, c) =>
        gf.connectX(
          {
            mixBlendMode: "normal",
            strokeWidth: 1,
          },
          items.map((d) => gf.ref(\`\${d.x}-\${d.c}\`))
        )
      )
      .value(),
  ])
);
`,
      },
      {
        id: "line-chart",
        title: "Line Chart",
        demoUrl: "/examples/line-chart",
        code: `gf.render(
  root,
  { width: size.width, height: size.height },
  gf.frame([
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
  ])
);
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

gf.render(
  root,
  { width: size.width, height: size.height },
  gf.stack(
      { direction: 0, spacing: 4, alignment: "end" },
      // TODO: I could probably make the width be uniform flexible basically
      Object.entries(_.groupBy(data, "origin")).map(([origin, items]) =>
        gf.stack(
          { w: _(items).sumBy("count") / 2, direction: 1, spacing: 2, alignment: "middle", sharedScale: true },
          items.toReversed().map((d) =>
            gf.rect({
              h: gf.value(d.count, "count"),
              fill: d.origin === "Europe" ? gf.color.red[5] : d.origin === "Japan" ? gf.color.blue[5] : gf.color.green[5],
            })
          )
        )
      )
    )
);
        `,
      },
      {
        id: "nested-mosaic-plot",
        title: "Nested Mosaic Plot",
        demoUrl: "/examples/nested-mosaic-plot",
        code: `
const classColor = {
  First: gf.color.red[5],
  Second: gf.color.blue[5],
  Third: gf.color.green[5],
  Crew: gf.color.orange[5],
};
        
gf.render(
  root,
  { width: size.width, height: size.height },
        gf.stackY(
    { spacing: 4, alignment: "middle" },
    _(titanic)
      .groupBy("class")
      .map(
        (items, cls) =>
          gf.stackX(
            { h: _(items).sumBy("count") / 10, spacing: 2, alignment: "middle" },
            _(items)
              .groupBy("sex")
              .map((sItems, sex) =>
                gf.stackY(
                  {
                    w: (_(sItems).sumBy("count") / _(items).sumBy("count")) * 100,
                    spacing: 0,
                    alignment: "middle",
                    sharedScale: true,
                  },
                  _(sItems)
                    .groupBy("survived")
                    .map((items, survived) =>
                      gf.rect({
                        h: gf.value(_(items).sumBy("count"), "survived"),
                        fill:
                          survived === "No"
                            ? gf.black
                            : classColor[cls],
                      })
                    )
                    .value()
                )
              )
              .value()
          )
      )
      .value()
    )
)
        `,
      },
      {
        id: "ribbon-chart",
        title: "Ribbon Chart",
        demoUrl: "/examples/ribbon-chart",
        description:
          "A hybrid between a stacked bar chart and a stacked area chart.",
        code: `
        gf.render(
  root,
  { width: size.width, height: size.height },
  gf.frame([
    gf.stackX(
      { spacing: 64, sharedScale: true },
      _(catchData)
        .groupBy("lake")
        .map((d) =>
          gf.stackY(
            { spacing: 2 },
            _(d)
              .orderBy("count", "desc")
              .map((d) =>
                gf.rect({
                  name: \`\${d.lake}-\${d.species}\`,
                  w: 16,
                  h: gf.value(d.count),
                  fill: gf.value(d.species),
                })
              )
              .value()
          )
        )
        .value()
    ),
    ..._(catchData)
      .groupBy("species")
      .map((items) =>
        gf.connectX(
          { opacity: 0.8 },
          items.map((d) => gf.ref(\`\${d.lake}-\${d.species}\`))
        )
      )
      .value(),
  ])
)
        `,
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
