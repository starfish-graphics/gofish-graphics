const boxAndWhisker = ({ median, min, max, q1, q3, fill, w = 8 }) => {
  const minName = `min-${Math.random().toString(36).substring(2, 9)}`;
  const maxName = `max-${Math.random().toString(36).substring(2, 9)}`;
  return Frame({ y: 0 }, [
    Rect({ y: 0, w: 0, h: 0 }),
    Rect({ w, h: w / 8, y: min, fill: "gray" }).name(minName),
    Rect({ w, h: w / 8, y: max, fill: "gray" }).name(maxName),
    ConnectY({ mode: "center-to-center", strokeWidth: w / 8 }, [
      Ref(minName),
      Ref(maxName),
    ]),
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
