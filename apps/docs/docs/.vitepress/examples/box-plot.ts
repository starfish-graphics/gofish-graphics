const boxAndWhisker = ({ median, min, max, q1, q3, fill }) => {
  const minName = `min-${Math.random().toString(36).substring(2, 9)}`;
  const maxName = `max-${Math.random().toString(36).substring(2, 9)}`;
  return Frame({}, [
    Rect({ w: 8, h: 1, y: v(min), fill: "gray" }).name(minName),
    Rect({ w: 8, h: 1, y: v(max), fill: "gray" }).name(maxName),
    ConnectY({ mode: "center-to-center", strokeWidth: 1 }, [
      Ref(minName),
      Ref(maxName),
    ]),
    Rect({ w: 8, y: v(q1), h: v(q3 - q1), fill }),
    Rect({ w: 8, h: 1, y: v(median), fill: "white" }),
  ]);
};

StackX(
  {
    spacing: 8,
    sharedScale: true,
  },
  For(
    groupBy(
      orderBy(genderPayGap, (d) => payGrade.indexOf(d["Pay Grade"])),
      "Pay Grade"
    ),
    (d, key) =>
      StackX(
        {
          key,
          spacing: 8,
        },
        For(groupBy(d, "Gender"), (d, key) =>
          boxAndWhisker({
            median: d[0].Median,
            min: d[0].Min,
            max: d[0].Max,
            q1: d[0]["25-Percentile"],
            q3: d[0]["75-Percentile"],
            fill: v(key),
          })
        )
      )
  )
).render(root, { w: 500, h: 600 });

// StackX(
//   {
//     spacing: 24,
//     sharedScale: true,
//   },
//   For(
//     groupBy(
//       _.orderBy(genderPayGap, (d) => payGrade.indexOf(d["Pay Grade"])),
//       "Pay Grade"
//     ),
//     (d, key) =>
//       StackX(
//         {
//           key,
//           spacing: 16,
//         },
//         For(groupBy(d, "Gender"), (d, key) =>
//           boxAndWhisker({
//             median: d[0].Median / 150,
//             min: d[0].Min / 150,
//             max: d[0].Max / 150,
//             q1: d[0]["25-Percentile"] / 150,
//             q3: d[0]["75-Percentile"] / 150,
//             fill: v(key),
//             w: 16,
//           })
//         )
//       )
//   )
// ).render(root, { w: 500, h: 600 });
