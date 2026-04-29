const boxAndWhisker = ({ median, min, max, q1, q3, fill }) => {
  const minName = `min-${Math.random().toString(36).substring(2, 9)}`;
  const maxName = `max-${Math.random().toString(36).substring(2, 9)}`;
  return gf.frame({}, [
    gf.rect({ w: 8, h: 1, y: gf.v(min), fill: "gray" }).name(minName),
    gf.rect({ w: 8, h: 1, y: gf.v(max), fill: "gray" }).name(maxName),
    gf.connectY({ mode: "center", strokeWidth: 1 }, [
      gf.ref(minName),
      gf.ref(maxName),
    ]),
    gf.rect({ w: 8, y: gf.v(q1), h: gf.v(q3 - q1), fill }),
    gf.rect({ w: 8, h: 1, y: gf.v(median), fill: "white" }),
  ]);
};

gf.stackX(
  {
    spacing: 8,
    sharedScale: true,
  },
  gf.For(
    _.groupBy(
      _.orderBy(genderPayGap, (d) => payGrade.indexOf(d["Pay Grade"])),
      "Pay Grade"
    ),
    (d, key) =>
      gf.stackX(
        {
          key,
          spacing: 8,
        },
        gf.For(_.groupBy(d, "Gender"), (d, key) =>
          boxAndWhisker({
            median: d[0].Median,
            min: d[0].Min,
            max: d[0].Max,
            q1: d[0]["25-Percentile"],
            q3: d[0]["75-Percentile"],
            fill: gf.v(key),
          })
        )
      )
  )
).render(root, { w: 500, h: 600 });

// gf.stackX(
//   {
//     spacing: 24,
//     sharedScale: true,
//   },
//   gf.For(
//     _.groupBy(
//       _.orderBy(genderPayGap, (d) => payGrade.indexOf(d["Pay Grade"])),
//       "Pay Grade"
//     ),
//     (d, key) =>
//       gf.stackX(
//         {
//           key,
//           spacing: 16,
//         },
//         gf.For(_.groupBy(d, "Gender"), (d, key) =>
//           boxAndWhisker({
//             median: d[0].Median / 150,
//             min: d[0].Min / 150,
//             max: d[0].Max / 150,
//             q1: d[0]["25-Percentile"] / 150,
//             q3: d[0]["75-Percentile"] / 150,
//             fill: gf.v(key),
//             w: 16,
//           })
//         )
//       )
//   )
// ).render(root, { w: 500, h: 600 });
