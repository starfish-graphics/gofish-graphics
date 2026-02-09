# Layer naming API: `.as()` on chart → `.name()` on mark

## Summary

Layer names are now set on the **mark** via `.name("layerName")` instead of on the chart builder via `.as("layerName")`. This keeps naming colocated with the mark and makes the API consistent: the thing that produces the layer is the thing you name.

## Before

```ts
chart(data)
  .flow(spread("x", { dir: "x" }), stack("species", { dir: "y" }))
  .mark(rect({ h: "count", fill: "species" }))
  .as("bars")
```

## After

```ts
chart(data)
  .flow(spread("x", { dir: "x" }), stack("species", { dir: "y" }))
  .mark(rect({ h: "count", fill: "species" }).name("bars"))
```

## Changes

- **Chart API**: Layer naming is no longer done with `.as("layerName")` on the chart builder. Use `.name("layerName")` on the mark passed to `.mark()` instead.
- **Marks**: `rect()`, `circle()`, `scaffold()`, and other chart marks support `.name("layerName")` so that layers can be referenced by `select("layerName")` in layered charts.
- **Docs & examples**: All docs, examples, Storybook stories, and HeroCode snippets updated to the new pattern.
- **CLAUDE.md**: Updated v3 API description to document `.name()` on marks and remove `.as()` from builder methods.

## Migration

Replace:

- `chart(...).mark(someMark).as("bars")`

with:

- `chart(...).mark(someMark.name("bars"))`

`select("bars")` and the rest of the layering API are unchanged.
