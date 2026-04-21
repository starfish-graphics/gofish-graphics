# ref

References another node so later marks can reuse its position or bounding box — the basis for overlays, connectors, and arrows.

See also [How to name and scope](/api/howto/naming-and-scoping) for when to use strings vs. tokens vs. paths.

## Signature

```ts
ref(
  nodeOrSelection:
    | string                              // layer-local lookup
    | Token                               // global lookup (from createName)
    | (Token | string | number)[]         // path
    | GoFishNode                          // direct node
    | { __ref: GoFishNode }
);
```

## Forms

### String — layer-local

`ref("x")` walks up the parent chain to the nearest `Layer` and picks the direct child named `.name("x")`. Strings do **not** cross component boundaries.

```ts
Layer([
  rect({ w: 80, h: 40 }).name("bg"),
  ref("bg"), // resolves to the rect above
]);
```

### Token — globally addressable

A `Token` (from [`createName`](/api/howto/naming-and-scoping#createname)) is a unique JS value. `.name(token)` registers the node in a global token context; `ref(token)` retrieves it.

```ts
const targetName = createName("target");

Layer([
  rect({ w: 80, h: 40 }).name(targetName),
  // ...somewhere in a sibling subtree:
  ref(targetName),
]);
```

### Path — step through scopes + positional children

A path array starts at a `Token` and descends one step per segment. Tag strings resolve against the current node's scope map (populated by `createName`-tagged children inside a scope root). Numbers pick the positional child at that index.

```ts
ref([globalFrameName, "variables", 2, "value"]);
//   └─ Token ──────┘  └─ tag ──┘  └┘  └─ tag ─┘
//   global lookup     scope-map   i-th  scope-map
//                     on token    child on prev
```

### Direct node

Pass a `GoFishNode` (or a `.__ref` wrapper) to reference it without name resolution.

```ts
const bar = rect({ h: "value" });
Layer([bar, ref(bar)]);
```

## Parameters

| Parameter         | Type                                                                                      | Description                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `nodeOrSelection` | `string \| Token \| (Token \| string \| number)[] \| GoFishNode \| { __ref: GoFishNode }` | What to reference. See forms above — string (local), Token (global), path, or the node. |

## Notes

- Refs participate in layout: the referenced node's placement determines the ref's bounding box, and `Arrow`, `connect`, etc. use that to draw geometry between nodes.
- Cross-subtree refs resolve correctly: the ref traverses to the least common ancestor and accumulates coordinate transforms along the way, so you can ref a node inside one component from inside another.
- Errors name the scope: if a path segment misses, the error lists the tags or indices available at that level.
