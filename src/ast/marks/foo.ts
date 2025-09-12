// This file is for experimenting with chart composition syntax.
// The code below is a sketch of a possible API for declarative chart construction.

function chart(data, ...operators) {
  let c = { data, operators: [] };
  for (const op of operators) {
    c = op(c);
  }
  return c;
}

function layer(...charts) {
  return (c) => ({
    ...c,
    layer: charts,
  });
}

function scatter_by(key, options) {
  return (c) => ({
    ...c,
    scatter: { key, ...options },
  });
}

function circle() {
  return (c) => ({
    ...c,
    mark: "circle",
  });
}

function spread_by(key, options) {
  return (c) => ({
    ...c,
    spread: { key, ...options },
  });
}

function stack_by(key, options) {
  return (c) => ({
    ...c,
    stack: { key, ...options },
  });
}

function rect(options) {
  return (c) => ({
    ...c,
    mark: "rect",
    ...options,
  });
}

seafood = [];

chart(
  seafood,
  layer(
    chart(scatter_by("lake", { x: "x", y: "y" }), circle()),
    chart(
      spread_by("lake", { dir: "x" }),
      stack_by("species", { dir: "y" }),
      rect({ h: "count", fill: "species" })
    )
  )
);
