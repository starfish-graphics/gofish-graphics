// import { density1d } from "fast-kde";

StackX(
  { spacing: 64, sharedScale: true },
  For(groupBy(penguins, "Species"), (d, species) => {
    const density = Array.from(
      density1d(d.map((p) => p["Body Mass (g)"]).filter((w) => w !== null))
    );
    return Frame({}, [
      StackY(
        { spacing: 0 },
        For(density, (d) =>
          Rect({ y: d.x / 40, w: d.y * 100000, h: 0, fill: v(species) }).name(
            `${species}-${d.x}`
          )
        )
      ),
      ConnectY(
        { opacity: 1, mixBlendMode: "normal" },
        For(density, (d) => Ref(`${species}-${d.x}`))
      ),
    ]);
  })
).render(root, { w: 500, h: 300 });
