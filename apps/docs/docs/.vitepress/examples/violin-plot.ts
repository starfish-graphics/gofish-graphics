// import { density1d } from "fast-kde";

gf.stackX(
  { spacing: 64, sharedScale: true },
  gf.For(_.groupBy(penguins, "Species"), (d, species) => {
    const density = Array.from(
      density1d(d.map((p) => p["Body Mass (g)"]).filter((w) => w !== null))
    );
    return gf.frame({}, [
      gf.stackY(
        { spacing: 0, alignment: "middle" },
        gf.For(density, (d) =>
          gf
            .rect({ y: d.x / 40, w: d.y * 100000, h: 0, fill: gf.v(species) })
            .name(`${species}-${d.x}`)
        )
      ),
      gf.connectY(
        { opacity: 1, mixBlendMode: "normal" },
        gf.For(density, (d) => gf.ref(`${species}-${d.x}`))
      ),
    ]);
  })
).render(root, { w: 500, h: 300 });
