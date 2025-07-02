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
).render(root, { w: 500, h: 300, axes: true });`,
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
  ).render(root, { w: 500, h: 300 });
`,
      },
      {
        id: "stacked-bar-chart",
        title: "Stacked Bar Chart",
        // description: "A simple stacked bar chart",
        demoUrl: "/examples/stacked-bar-chart",
        code: `StackX({ spacing: 8, sharedScale: true },
  For(groupBy(seafood, "lake"), (lake, key) =>
    StackY({ key, spacing: 0 },
      For(lake, (d) =>
        Rect({ w: 32, h: v(d.count), fill: v(d.species) }))))
).render(root, { w: 500, h: 300, axes: true });
`,
      },
      {
        id: "grouped-bar-chart",
        title: "Grouped Bar Chart",
        description: "Horizontally stacked vertical bars",
        demoUrl: "/examples/grouped-bar-chart",
        code: `StackX({ spacing: 16, sharedScale: true },
  For(groupBy(seafood, "lake"), (lake, key) =>
    StackX({ key, spacing: 1 },
      For(lake, (d) =>
        Rect({ w: 12, h: v(d.count), fill: v(d.species) })))),
).render(root, { w: 500, h: 300, axes: true });`,
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
]).render(root, { w: 500, h: 300 });`,
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
  ]).render(root, { w: 500, h: 300, axes: true });`,
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
  ).render(root, { w: 500, h: 300 });`,
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
]).render(root, { w: 500, h: 300, });`,
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
  ]).render(root, { w: 500, h: 300 });
`,
      },
      {
        id: "scatter-plot",
        title: "Scatter Plot",
        demoUrl: "/examples/scatter-plot",
        code: `gf.render(
  root,
  { w: 500, h: 300 },
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

Frame({ coord: Polar() }, [
  StackX({ spacing: 0, sharedScale: true },
    For(data, (d, i) =>
      Rect({ h: 100, w: v(d.value), fill: color6[i % 6] }))),
]).render(root, { w: 500, h: 300, x: 300 });
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

Frame({ coord: Polar() }, [
  StackX({ y: 50, spacing: 0, sharedScale: true },
    For(data, (d, i) =>
      Rect({ h: 50, w: v(d.value), fill: color6[i % 6] }))),
]).render(root, { w: 500, h: 300, x: 300, y: 200 });
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
    ).render(root, { w: 500, h: 300 });
        `,
      },
      {
        id: "nested-mosaic-plot",
        title: "Nested Mosaic Plot",
        demoUrl: "/examples/nested-mosaic-plot",
        code: `const classColor = {
  First: color.red[5],
  Second: color.blue[5],
  Third: color.green[5],
  Crew: color.orange[5],
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
              fill: survived === "No" ? mix(classColor[cls], black, 0.7) : classColor[cls],
            }),
          ),
        ),
      ),
    ),
  ),
).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "ribbon-chart",
        title: "Ribbon Chart",
        demoUrl: "/examples/ribbon-chart",
        description:
          "A hybrid between a stacked bar chart and a stacked area chart",
        code: `Frame([
  StackX({ spacing: 64, sharedScale: true },
    For(groupBy(seafood, "lake"), (d) =>
      StackY({ spacing: 2 },
        For(_(d).orderBy("count", "desc"), (d) =>
          Rect({ name: \`\${d.lake}-\${d.species}\`, w: 16, h: v(d.count), fill: v(d.species) }))))),
    For(groupBy(seafood, "species"), (items) =>
      ConnectX({ opacity: 0.8 },
        For(items, (d) => Ref(\`\${d.lake}-\${d.species}\`)))),
  ]).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "rose-chart",
        title: "Rose Chart",
        description:
          "A pie chart with data-driven radius instead of angle, popularized by Florence Nightingale",
        demoUrl: "/examples/rose-chart",
        code: `Frame({ coord: Polar() }, [
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
  ]).render(root, { w: 500, h: 500, x: 200, y: 300 });`,
      },
      {
        id: "connected-scatter-plot",
        title: "Connected Scatter Plot",
        description: "A scatter plot with lines connecting the points",
        demoUrl: "/examples/connected-scatter-plot",
        code: `Frame({}, [
    For(drivingShifts, (d) =>
      Ellipse({
        x: v(d.miles),
        y: v(d.gas),
        w: 6,
        h: 6,
        fill: "white",
        stroke: "black",
        strokeWidth: 2,
      }).name(\`\${d.year}\`)
    ),
    ConnectX(
      {
        interpolation: "linear",
        stroke: "black",
        strokeWidth: 2,
        mode: "center-to-center",
      },
      For(drivingShifts, (d) => Ref(\`\${d.year}\`))
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
  ]).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "bump-chart",
        title: "Bump Chart",
        description: "A discrete line chart",
        demoUrl: "/examples/bump-chart",
        code: `Frame({}, [
    For(groupBy(newCarColors, "Year"), (d, key) =>
      StackY(
        {
          x: (key - 2000) * 30,
          spacing: 16,
          alignment: "start",
        },
        For(_.sortBy(d, "Rank"), (d) => Ellipse({ w: 8, h: 8, fill: v(d.Color) }).name(\`\${d.Color}-\${d.Year}\`))
      )
    ),
    For(groupBy(newCarColors, "Color"), (d) =>
      ConnectY(
        { strokeWidth: 2, mode: "center-to-center" },
        For(d, (d) => Ref(\`\${d.Color}-\${d.Year}\`))
      )
    ),
  ]).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "stringline",
        title: "Stringline Chart",
        description:
          "Also known as a Marey or time-distance chart. Often used to visualize transit data.",
        demoUrl: "/examples/stringline",
        code: `const caltrainProcessed = caltrain.filter((d) => d.Type !== "Bullet");

        Frame({}, [
    StackY(
      {
        spacing: 8,
        alignment: "start",
      },
      For(
        groupBy(
          _.orderBy(caltrainProcessed, (d) => caltrainStopOrder.indexOf(d.Station), "desc"),
          "Station"
        ),
        (d, key) =>
          Frame({ key }, [
            Rect({ w: 0, h: 0 }),
            For(d, (d) =>
              Ellipse({ x: d.Time / 3, w: 4, h: 4, fill: v(d.Direction) }).name(\`\${d.Train}-\${d.Station}-\${d.Time}\`)
            ),
          ])
      )
    ),
    For(groupBy(caltrainProcessed, "Train"), (d) =>
      ConnectY(
        { strokeWidth: 1, mode: "center-to-center" },
        For(d, (d) => Ref(\`\${d.Train}-\${d.Station}-\${d.Time}\`))
      )
    ),
  ]).render(root, { w: 500, h: 400 });`,
      },
      {
        id: "violin-plot",
        title: "Violin Plot",
        description: "A probability density visualization using areas.",
        demoUrl: "/examples/violin-plot",
        code: `// import { density1d } from "fast-kde";
        
StackX(
    { spacing: 64, sharedScale: true },
    For(groupBy(penguins, "Species"), (d, species) => {
      const density = Array.from(density1d(d.map((p) => p["Body Mass (g)"]).filter((w) => w !== null)));
      return Frame({}, [
        StackY(
          { spacing: 0 },
          For(density, (d) => Rect({ y: d.x / 40, w: d.y * 100000, h: 0, fill: v(species) }).name(\`\${species}-\${d.x}\`))
        ),
        ConnectY(
          { opacity: 1, mixBlendMode: "normal" },
          For(density, (d) => Ref(\`\${species}-\${d.x}\`))
        ),
      ]);
    })
  ).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "box-plot",
        title: "Box Plot",
        description: "A box and whiskers plot",
        demoUrl: "/examples/box-plot",
        code: `const boxAndWhisker = ({
  median,
  min,
  max,
  q1,
  q3,
  fill,
  w = 8,
}) => {
  const minName = \`min-\${Math.random().toString(36).substring(2, 9)}\`;
  const maxName = \`max-\${Math.random().toString(36).substring(2, 9)}\`;
  return Frame({ y: 0 }, [
    Rect({ y: 0, w: 0, h: 0 }),
    Rect({ w, h: w / 8, y: min, fill: "gray" }).name(minName),
    Rect({ w, h: w / 8, y: max, fill: "gray" }).name(maxName),
    ConnectY({ mode: "center-to-center", strokeWidth: w / 8 }, [Ref(minName), Ref(maxName)]),
    Rect({ w, y: q1, h: q3 - q1, fill }),
    Rect({ w, h: w / 8, y: median, fill: "white" }),
  ]);
};


  StackX(
    {
      spacing: 24,
      sharedScale: true,
    },
    For(
      groupBy(
        _.orderBy(genderPayGap, (d) => payGrade.indexOf(d["Pay Grade"])),
        "Pay Grade"
      ),
      (d, key) =>
        StackX(
          {
            key,
            spacing: 16,
          },
          For(groupBy(d, "Gender"), (d, key) =>
            boxAndWhisker({
              median: d[0].Median / 150,
              min: d[0].Min / 150,
              max: d[0].Max / 150,
              q1: d[0]["25-Percentile"] / 150,
              q3: d[0]["75-Percentile"] / 150,
              fill: v(key),
              w: 16,
            })
          )
        )
    )
  ).render(root, { w: 500, h: 600, y: -800 });
`,
      },
      {
        id: "sankey-tree",
        title: "Sankey Tree",
        description: "A sankey tree diagram",
        demoUrl: "/examples/sankey-tree",
        code: `const layerSpacing = 64;
const internalSpacing = 2;

const classColor = {
  First: mix(color6_old[0], white, 0.5),
  Second: mix(color6_old[0], black, 0),
  Third: mix(color6_old[0], black, 0.4),
  Crew: mix(color6_old[0], black, 0.7),
};


        Frame([
    StackX({ spacing: layerSpacing, alignment: "middle" }, [
      StackY(
        { spacing: 0, alignment: "middle" },
        For(groupBy(titanic, "class"), (items, cls) =>
          Rect({
            w: 40,
            h: _(items).sumBy("count") / 10,
            fill: "gray",
          }).name(\`\${cls}-src\`)
        )
      ),
      StackY(
        { spacing: internalSpacing, alignment: "middle" },
        For(groupBy(titanic, "class"), (items, cls) =>
          StackX({ spacing: layerSpacing, alignment: "middle" }, [
            StackY(
              { spacing: 0, alignment: "middle" },
              For(groupBy(items, "sex"), (items, sex) =>
                Rect({
                  w: 40,
                  h: _(items).sumBy("count") / 10,
                  fill: classColor[cls],
                }).name(\`\${cls}-\${sex}-src\`)
              )
            ).name(\`\${cls}-tgt\`),
            StackY(
              {
                h: _(items).sumBy("count") / 10,
                spacing: internalSpacing * 2,
                alignment: "middle",
              },
              For(groupBy(items, "sex"), (items, sex) =>
                StackX({ spacing: layerSpacing, alignment: "middle" }, [
                  StackY(
                    {
                      spacing: 0,
                      alignment: "middle",
                    },
                    For(groupBy(items, "survived"), (survivedItems, survived) =>
                      Rect({
                        w: 40,
                        h: _(survivedItems).sumBy("count") / 10,
                        fill: sex === "Female" ? color6_old[2] : color6_old[3],
                      }).name(\`\${cls}-\${sex}-\${survived}-src\`)
                    )
                  ).name(\`\${cls}-\${sex}-tgt\`),
                  StackY(
                    {
                      w: 40,
                      spacing: internalSpacing * 4,
                      alignment: "middle",
                    },
                    For(groupBy(items, "survived"), (survivedItems, survived) => {
                      return Rect({
                        h: _(survivedItems).sumBy("count") / 10,
                        fill:
                          sex === "Female"
                            ? survived === "No"
                              ? mix(color6_old[2], black, 0.5)
                              : mix(color6_old[2], white, 0.5)
                            : survived === "No"
                            ? mix(color6_old[3], black, 0.5)
                            : mix(color6_old[3], white, 0.5),
                      }).name(\`\${cls}-\${sex}-\${survived}-tgt\`);
                    })
                  ),
                ])
              )
            ),
          ])
        )
      ),
    ]),
    For(groupBy(titanic, "class"), (items, cls) => [
      ConnectX(
        {
          fill: classColor[cls],
          interpolation: "bezier",
          opacity: 0.7,
        },
        [Ref(\`\${cls}-src\`), Ref(\`\${cls}-tgt\`)]
      ),
      For(groupBy(items, "sex"), (sexItems, sex) => [
        ConnectX(
          {
            fill: sex === "Female" ? color6_old[2] : color6_old[3],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [Ref(\`\${cls}-\${sex}-src\`), Ref(\`\${cls}-\${sex}-tgt\`)]
        ),
        For(groupBy(sexItems, "survived"), (survivedItems, survived) =>
          ConnectX(
            {
              fill:
                sex === "Female"
                  ? survived === "No"
                    ? mix(color6_old[2], black, 0.5)
                    : mix(color6_old[2], white, 0.5)
                  : survived === "No"
                  ? mix(color6_old[3], black, 0.5)
                  : mix(color6_old[3], white, 0.5),
              interpolation: "bezier",
              opacity: 0.7,
            },
            [Ref(\`\${cls}-\${sex}-\${survived}-src\`), Ref(\`\${cls}-\${sex}-\${survived}-tgt\`)]
          )
        ),
      ]),
    ]),
  ]).render(root, { w: 500, h: 400 });`,
      },
      {
        id: "balloon-chart",
        title: "Balloon Chart",
        description: "Festive party balloons!",
        demoUrl: "/examples/balloon-chart",
        code: `const colorMap = {
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
      y: options?.y - 25 * (options?.scale ?? 1),
      box: true,
      transform: { scale: { x: options?.scale ?? 1, y: options?.scale ?? 1 } },
    },
    [
      Ellipse({ cx: 15, cy: 15, w: 24, h: 30, fill: (options?.color ?? color.red)[4] }),
      Ellipse({ cx: 12, cy: 11, w: 7, h: 11, fill: (options?.color ?? color.red)[3] }),
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
  )

    Frame(
      { coord: Wavy(), x: 0, y: 0 },
      For(scatterData, (data, i) =>
        Frame([
          Rect({
            x: data.x,
            w: 1,
            y: data.y,
            h: size.height - data.y,
            emY: true,
            fill: black,
          }),
          Balloon({ scale: 1, x: data.x, y: data.y, color: colorMap[i % 6] }),
        ])
      )
    ).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "scatterpie",
        title: "Scatterpie",
        description: "A scatterplot where each point is a pie chart",
        demoUrl: "/examples/scatterpie",
        code: `const scatterData = _(seafood)
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

    Frame(
      For(scatterData, (sample) =>
        Frame(
          {
            x: sample.x,
            y: sample.y,
            coord: Polar(),
          },
          [
            StackX(
              { h: _(sample.collection).sumBy("count") / 7, spacing: 0, alignment: "start", sharedScale: true },
              For(sample.collection, (d, i) =>
                Rect({
                  w: v(d.count),
                  fill: color6[i % 6],
                })
              )
            ),
          ]
        )
      )
    ).render(root, { w: 500, h: 300 });`,
      },
      {
        id: "flower-chart",
        title: "Flower Chart",
        description:
          "A flower chart inspired by Moritz Stefaner's OECD Better Life Index visualization",
        demoUrl: "/examples/flower-chart",
        code: `
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

  Frame(
    For(scatterData, (sample) =>
      Frame({x: sample.x, y: sample.y}, [
        Rect({
            w: 2,
            h: 300 - sample.y,
            fill: color.green[5],
          }),
          Frame(
            {
              coord: Polar(),
            },
            [
              StackX(
                { h: _(sample.collection).sumBy("count") / 7, spacing: 0, alignment: "start", sharedScale: true },
                For(sample.collection, (d, i) =>
                  Petal({
                    w: v(d.count),
                    fill: mix(color6[i % 6], white, 0.5),
                  })
                )
              ),
            ]
          ),
        ])
      )
    ).render(root, { w: 500, h: 300 });
`,
      },
      {
        id: "polar-ribbon-chart",
        title: "Polar Ribbon Chart",
        description: "A polar ribbon chart",
        demoUrl: "/examples/polar-ribbon-chart",
        code: `Frame({ coord: Polar() }, [
      StackX(
        {
          y: 50,
          x: (-3 * Math.PI) / 6,
          spacing: (2 * Math.PI) / 6,
          alignment: "start",
          sharedScale: true,
          mode: "center-to-center",
        },
        For(groupBy(seafood, "lake"), (items, lake) =>
          StackY(
            { spacing: 2, reverse: true },
            For(_(items).orderBy("count", "desc"), (d) =>
                Rect({
                  w: 0.1,
                  h: v(d.count),
                  fill: v(d.species),
                }).name(\`\${d.lake}-\${d.species}\`)
              )
          )
        )
      ),
      For(groupBy(seafood, "species"), (items, species) =>
        ConnectX(
          { opacity: 0.8 },
          For(items, (d) => Ref(\`\${d.lake}-\${d.species}\`))
        )
      ),
    ]).render(root, { w: 500, h: 300, x: 200, y: 150 });`,
      },
    ];

    return {
      examples: examples.sort((a, b) => a.title.localeCompare(b.title)),
      getCodeById(id) {
        const example = examples.find((ex) => ex.id === id);
        return example ? example.code : null;
      },
    };
  },
};
