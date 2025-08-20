StackX(
  { spacing: 8, sharedScale: true },
  For(groupBy(seafood, "lake"), (d) =>
    StackY(
      { spacing: 2, alignment: "start" },
      For(
        _(d)
          .reverse()
          .flatMap((d) => Array(d.count).fill(d))
          .chunk(5)
          .reverse(),
        (d) =>
          StackX(
            { spacing: 2 },
            For(d, (d) => Rect({ w: 8, h: 8, fill: v(d.species) }))
          )
      )
    )
  )
).render(root, { w: 500, h: 300 });

/* TODO?
rect(seafood, { w: 8, h: 8, fill: "species" })
  .stackX(undefined)
  .stackY("chunks")
  .derive((d) => d.reverse().flatMap((d) => Array(d.count).fill(d)).chunk(5).reverse())
  .spreadX("lake")
  .render(root, { w: 500, h: 300, axes: true });
*/
