const layerSpacing = 64;
const internalSpacing = 2;

const classColor = {
  First: gf.color6[0],
  Second: gf.color6[1],
  Third: gf.color6[2],
  Crew: gf.color6[3],
};

gf.Frame([
  gf.StackX({ spacing: layerSpacing, alignment: "middle" }, [
    gf.StackY(
      { spacing: 0, alignment: "middle" },
      gf.For(_.groupBy(titanic, "class"), (items, cls) =>
        gf.Rect({
          w: 40,
          h: _(items).sumBy("count") / 10,
          fill: gf.neutral,
        }).name(`${cls}-src`)
      )
    ),
    gf.StackY(
      { spacing: internalSpacing, alignment: "middle" },
      gf.For(_.groupBy(titanic, "class"), (items, cls) =>
        gf.StackX({ spacing: layerSpacing, alignment: "middle" }, [
          gf.StackY(
            { spacing: 0, alignment: "middle" },
            gf.For(_.groupBy(items, "sex"), (items, sex) =>
              gf.Rect({
                w: 40,
                h: _(items).sumBy("count") / 10,
                fill: classColor[cls],
              }).name(`${cls}-${sex}-src`)
            )
          ).name(`${cls}-tgt`),
          gf.StackY(
            {
              h: _(items).sumBy("count") / 10,
              spacing: internalSpacing * 2,
              alignment: "middle",
            },
            gf.For(_.groupBy(items, "sex"), (items, sex) =>
              gf.StackX({ spacing: layerSpacing, alignment: "middle" }, [
                gf.StackY(
                  {
                    spacing: 0,
                    alignment: "middle",
                  },
                  gf.For(_.groupBy(items, "survived"), (survivedItems, survived) =>
                    gf.Rect({
                      w: 40,
                      h: _(survivedItems).sumBy("count") / 10,
                      fill: sex === "Female" ? gf.color6[4] : gf.color6[5],
                    }).name(`${cls}-${sex}-${survived}-src`)
                  )
                ).name(`${cls}-${sex}-tgt`),
                gf.StackY(
                  {
                    w: 40,
                    spacing: internalSpacing * 4,
                    alignment: "middle",
                  },
                  gf.For(_.groupBy(items, "survived"), (survivedItems, survived) => {
                    return gf.Rect({
                      h: _(survivedItems).sumBy("count") / 10,
                      fill:
                        sex === "Female"
                          ? survived === "No"
                            ? gf.gray
                            : gf.color6[4]
                          : survived === "No"
                          ? gf.gray
                          : gf.color6[5],
                    }).name(`${cls}-${sex}-${survived}-tgt`);
                  })
                ),
              ])
            )
          ),
        ])
      )
    ),
  ]),
  gf.For(_.groupBy(titanic, "class"), (items, cls) => [
    gf.ConnectX(
      {
        fill: classColor[cls],
        interpolation: "bezier",
        opacity: 0.7,
      },
      [gf.Ref(`${cls}-src`), gf.Ref(`${cls}-tgt`)]
    ),
    gf.For(_.groupBy(items, "sex"), (sexItems, sex) => [
      gf.ConnectX(
        {
          fill: sex === "Female" ? gf.color6[4] : gf.color6[5],
          interpolation: "bezier",
          opacity: 0.7,
        },
        [gf.Ref(`${cls}-${sex}-src`), gf.Ref(`${cls}-${sex}-tgt`)]
      ),
      gf.For(_.groupBy(sexItems, "survived"), (survivedItems, survived) =>
        gf.ConnectX(
          {
            fill:
              sex === "Female"
                ? survived === "No"
                  ? gf.gray
                  : gf.color6[4]
                : survived === "No"
                ? gf.gray
                : gf.color6[5],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [
            gf.Ref(`${cls}-${sex}-${survived}-src`),
            gf.Ref(`${cls}-${sex}-${survived}-tgt`),
          ]
        )
      ),
    ]),
  ]),
]).render(root, { w: 500, h: 400 });
