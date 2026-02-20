const alphabet = [
  { letter: "A", frequency: 28 },
  { letter: "B", frequency: 55 },
  { letter: "C", frequency: 43 },
  { letter: "D", frequency: 91 },
  { letter: "E", frequency: 81 },
  { letter: "F", frequency: 53 },
  { letter: "G", frequency: 19 },
  { letter: "H", frequency: 87 },
  { letter: "I", frequency: 52 },
];

gf.Chart(alphabet)
  .flow(gf.spread("letter", { dir: "x" }))
  .mark(gf.rect({ h: "frequency" }))
  .render(root, {
    w: 500,
    h: 300,
    axes: true,
  });