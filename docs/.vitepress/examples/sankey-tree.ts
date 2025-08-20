const layerSpacing = 64;
const internalSpacing = 2;

const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

Frame([
  StackX({ spacing: layerSpacing, alignment: "middle" }, [
    StackY(
      { spacing: 0, alignment: "middle" },
      For(groupBy(titanic, "class"), (items, cls) =>
        Rect({
          w: 40,
          h: _(items).sumBy("count") / 10,
          fill: neutral,
        }).name(`${cls}-src`)
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
              }).name(`${cls}-${sex}-src`)
            )
          ).name(`${cls}-tgt`),
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
                      fill: sex === "Female" ? color6[4] : color6[5],
                    }).name(`${cls}-${sex}-${survived}-src`)
                  )
                ).name(`${cls}-${sex}-tgt`),
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
                            ? gray
                            : color6[4]
                          : survived === "No"
                          ? gray
                          : color6[5],
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
  For(groupBy(titanic, "class"), (items, cls) => [
    ConnectX(
      {
        fill: classColor[cls],
        interpolation: "bezier",
        opacity: 0.7,
      },
      [Ref(`${cls}-src`), Ref(`${cls}-tgt`)]
    ),
    For(groupBy(items, "sex"), (sexItems, sex) => [
      ConnectX(
        {
          fill: sex === "Female" ? color6[4] : color6[5],
          interpolation: "bezier",
          opacity: 0.7,
        },
        [Ref(`${cls}-${sex}-src`), Ref(`${cls}-${sex}-tgt`)]
      ),
      For(groupBy(sexItems, "survived"), (survivedItems, survived) =>
        ConnectX(
          {
            fill:
              sex === "Female"
                ? survived === "No"
                  ? gray
                  : color6[4]
                : survived === "No"
                ? gray
                : color6[5],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [
            Ref(`${cls}-${sex}-${survived}-src`),
            Ref(`${cls}-${sex}-${survived}-tgt`),
          ]
        )
      ),
    ]),
  ]),
]).render(root, { w: 500, h: 400 });
