const layerSpacing = 64;
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
                      fill: sex === "Female" ? color6_old[2] : color6_old[3],
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
                            ? mix(color6_old[2], black, 0.5)
                            : mix(color6_old[2], white, 0.5)
                          : survived === "No"
                          ? mix(color6_old[3], black, 0.5)
                          : mix(color6_old[3], white, 0.5),
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
          fill: sex === "Female" ? color6_old[2] : color6_old[3],
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
                  ? mix(color6_old[2], black, 0.5)
                  : mix(color6_old[2], white, 0.5)
                : survived === "No"
                ? mix(color6_old[3], black, 0.5)
                : mix(color6_old[3], white, 0.5),
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
