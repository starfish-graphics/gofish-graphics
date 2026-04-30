# The underlying space tree

Every node in a GoFish scenegraph carries two pieces of information about
its spatial structure: the kind of data space the node has established on
each of its two axes (x and y), and any per-axis Monotonic that captures
how visual size depends on a scale factor. Together these form an
intermediate representation called the **underlying space tree**.

The data structure lives at
[`packages/gofish-graphics/src/ast/underlyingSpace.ts`](../packages/gofish-graphics/src/ast/underlyingSpace.ts).
The traversal that builds it lives at
[`_node.ts:resolveUnderlyingSpace()`](../packages/gofish-graphics/src/ast/_node.ts).
Layout, axis rendering, posScale construction, and ordinal scale building
all consume the tree afterwards.

This doc explains what the tree is, why it exists, what each space kind
means, and where to look in the code. If you're adding an operator that
introduces or transforms an axis, this is the abstraction you're working
with.

## Why an explicit IR

Conventional grammars of graphics treat a scale as a function from a data
domain to a visual range. Quantitative x-scale: `[30, 50] mpg → [0, 100] px`.
Color scale: species name → palette entry. Convenient — but too unstructured.
If scales are arbitrary functions, the system can change their domains and
ranges freely, slot them in anywhere, and inference doesn't know which
combinations are meaningful.

In practice every visualization system relies on stronger invariants than
"function from domain to range" can express. Domains can be merged only
when they're compatible. Spatial continuous ranges aren't independent
parameters at all — they're derived from available layout space. Some
extents have meaningful origins; others only have meaningful differences.
Some operators glue subspaces together; others separate them. Coordinate
transforms preserve, warp, or erase parts of the underlying structure.

Discrete position scales make the mismatch concrete. D3 and Vega-Lite use
point and band scales to handle categorical positions. Operationally, a
band scale gives each category a continuous position together with a
uniform bandwidth. That's already the abstraction carrying layout
information indirectly. It also breaks down for bar-like charts whose
elements have different widths, because the allocation of space is no
longer a uniform function of category.

This kind of richer semantics shows up in the implementation of every
serious grammar system, even when it isn't reified:

- **Vega-Lite** parses each child view recursively, assigns scale-resolution
  policies (shared vs independent), and conditionally merges child scale
  components when their types are compatible. Compatibility groups several
  scale types together (e.g. temporal + ordinal-position). The merged
  result is a flat record keyed by channel — the tree structure of view
  composition guides merging, then disappears.
- **Observable Plot** distributes inference across channels (`fill`, `stroke`,
  `opacity`, `symbol` first infer which named scale they should use), a
  scale-name registry, scale-type inference (using user-specified types,
  mark-imposed channel types, explicit domains, channel values, color
  schemes, special defaults like `r` getting a sqrt scale), domain-union
  inference, and range inference that depends on both domain and scale
  kind. Modular, but no single spatial IR owns the accumulated semantics —
  Plot's `stack` transform, for example, rewrites a length channel into
  `y1`/`y2` so they can later participate in ordinary scale inference.

Each piece can be clean in isolation, but without an explicit source of
truth for the inferred spatial semantics, scale and domain facts have to
be passed around and reconstructed across the implementation. That's
particularly limiting in GoFish, where users define new operators and new
spaces — not just new marks inside a fixed scale-resolution pipeline.

GoFish's solution is to give the inference an explicit shared
data structure to contribute to. Marks introduce local spatial facts;
operators merge or separate them; coordinate transforms annotate them; and
later passes consume the tree for layout, scale construction, and guide
generation.

## The five space kinds

Each axis (x and y) of each node carries one of:

| kind         | meaning                                                                 | guide interpretation                                                | example source                                                  |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `position`   | absolute positions are meaningful; the space carries an interval domain | conventional quantitative axis (distances and positions both work)  | scatterplot x-position, y-axis of a stacked bar chart           |
| `difference` | relative differences meaningful; absolute positions not                 | magnitude guide; an axis with an arbitrary zero would be misleading | a streamgraph after baseline shifting                           |
| `size`       | data-driven extent, not yet placed in a shared position space           | legend / measurement guide; a position axis is premature            | a bar's height before stacking                                  |
| `ordinal`    | discrete keys; layout will assign positions                             | labels at laid-out keys; no continuous baseline necessarily implied | bars separated by category, facets                              |
| `undefined`  | no data-space contribution on this axis                                 | no guide                                                            | a purely aesthetic dimension or a decorative literal-pixel rect |

These kinds deliberately separate facts that a scale-as-function model
collapses. `size` and `position` may both eventually use numeric values
and continuous mappings, but they mean different things: `size` is an
unplaced extent; `position` is an extent embedded in a shared coordinate
space. `ordinal` isn't "a band scale"; it's a statement that the values
are discrete keys whose spatial allocation is the responsibility of
layout.

The data definitions:

```ts
// underlyingSpace.ts
export type POSITION_TYPE   = { kind: "position";   domain: Interval; ... };
export type DIFFERENCE_TYPE = { kind: "difference"; width: number;   ... };
export type SIZE_TYPE       = { kind: "size";       domain: Monotonic; ... };
export type ORDINAL_TYPE    = { kind: "ordinal";    domain?: string[]; ... };
export type UNDEFINED_TYPE  = { kind: "undefined";  ... };
```

`SIZE_TYPE.domain` is a `Monotonic` (`util/monotonic.ts`) — a function
that describes how the visual extent depends on a scale factor. For a
data-bound rect (`rect({ h: "count" })`), each rect emits
`SIZE(Monotonic.linear(value, 0))`. Operators compose them
(`Monotonic.add`, `Monotonic.adds(spacing)`, `Monotonic.smul(scale)`,
`Monotonic.max`). At layout time, a parent that needs a shared scale
factor calls `space.domain.inverse(canvas_size)` to solve for the scale
factor that makes the subtree fit.

## The contract

Each node implements `_resolveUnderlyingSpace`:

```ts
type ResolveUnderlyingSpace = (
  childSpaces: Size<UnderlyingSpace>[], // one [x, y] tuple per child
  childNodes: GoFishAST[],
  shared: Size<boolean> // [shared on x, shared on y]
) => FancySize<UnderlyingSpace>;
```

Returns the node's own `[xSpace, ySpace]`, computed bottom-up from the
already-resolved child spaces. The traversal is memoized at
[`_node.ts`'s `resolveUnderlyingSpace()`](../packages/gofish-graphics/src/ast/_node.ts).

Three patterns cover most operators:

**Leaf shapes** (`rect`, `ellipse`, `petal`, `text`, `image`) decide the
kind from their props. A rect with data-bound `h` emits
`SIZE(Monotonic.linear(value, 0))` on y; the same rect with literal `y`
and `y2` emits `POSITION([y, y2])`. Constants (no data-bound dim) emit
`UNDEFINED` — the literal pixel value is handled at layout time by
`computeAesthetic`, not via the underlying-space tree.

**Compositional operators** (`spread`, `stack`, `layer`, `enclose`)
combine children's spaces. `spread({ glue: false })` keeps SIZE
composition along the stack direction so a parent can solve for shared
scale factors via `Monotonic.inverse`. `spread({ glue: true })` (i.e.
`stack`) sums children's SIZE values into a `POSITION([0, sum])` — the
operator commits the data-driven extents to a positional axis. `layer`
and overlay-style operators use `unionChildSpaces` (`alignment.ts`),
which preserves SIZE when every child is SIZE and otherwise unions
intervals.

**Coordinate-transform operators** (`coord`) annotate the resulting
space with the transform that will later map underlying positions to
display positions, but otherwise pass the kind through.

## Worked example: stacked bar chart

```js
Chart(seafood)
  .flow(spread({ by: "lake", dir: "x" }), stack({ by: "species", dir: "y" }))
  .mark(rect({ h: "count", fill: "species" }));
```

Each `rect` starts with a data-driven height and no data-driven y
position: `[UNDEFINED, SIZE(Monotonic.linear(count, 0))]`.

The vertical `stack` (which is `spread({ glue: true, dir: "y" })`) glues
each lake's species rects together. Its stack-direction children are
all-SIZE, so it sums their domains at scale 1 and emits
`POSITION([0, total_lake_sum])` on y. The alignment direction (x) of the
stack is UNDEFINED because each rect's x is UNDEFINED.

The horizontal `spread` separates lakes. Its children are now stacks
with `[UNDEFINED on x, POSITION([0, total]) on y]`. Stack direction (x):
no children are SIZE, but they're named (the "by" key produces lake
keys) → `ORDINAL(["Lake A", ..., "Lake F"])`. Alignment direction (y):
all children are POSITION → `POSITION(unionAll([0, total_i]))`
= `POSITION([0, max_total])`.

So the root underlying space is `[ORDINAL(lakes), POSITION([0, max_total])]`.
The y-axis renders quantitative ticks (POSITION); the x-axis renders
ordinal labels at laid-out positions (ORDINAL); both follow from the
tree, with no special "bar chart" rule.

The stack's `size → position` transition is the important step. A single
rect with a data-driven height doesn't by itself establish where that
height lives in a shared coordinate system — it only says it has a
quantitative extent. The stack gives those extents a common origin and
glues them edge-to-edge, producing a `position` space from zero to the
bar total. The spread doesn't glue; it separates.

## Layout dispatch

After `resolveUnderlyingSpace`, layout proceeds on the principle that
**SIZE space drives Monotonic composition; POSITION space drives
position scales**. The two pipelines are mutually exclusive on a per-node
per-axis basis:

```
gofish.tsx (root):
  if root[axis].kind === "position"  → build a posScale via computePosScale
  if root[axis].kind === "size"      → invert the Monotonic against the canvas
                                       to seed the root scale factor
  pass both downward as (scaleFactors, posScales)

spread.layout (each spread/stack node):
  if shared[axis]:
    if myUSpace[axis].kind === "size"       → space.domain.inverse(size[axis])
    if myUSpace[axis].kind === "position"   → size[axis] / Interval.width(domain)
    if myUSpace[axis].kind === "difference" → size[axis] / space.width
    else → undefined (ORDINAL/UNDEFINED don't need a continuous scale factor)
```

Leaf shapes never need to compute their own scale factors — they receive
them via the `scaleFactors` parameter and apply them in `computeSize`.

This dispatch is the practical embodiment of the underlying-space-kind
distinction. It also happens to make the rendering pipeline more readable:
once you know the kind, you know which arithmetic applies.

## Axis inference

Once the tree is resolved, axis inference splits into two independent
questions:

1. **What guide could this space support?** Answered by the kind. POSITION
   permits a quantitative axis. ORDINAL permits labels at laid-out keys.
   DIFFERENCE permits a magnitude guide but not an axis with a meaningful
   zero. SIZE wants a legend or measurement guide; a position axis would
   be premature. UNDEFINED contributes nothing.
2. **Should that guide be drawn here?** Independent of the kind. A user
   or operator can tag nodes in the tree with whether an axis should
   render. The root of a stacked bar may have a POSITION y-space that
   permits a quantitative axis; a nested stack inside a more complex
   diagram may have the same kind without deserving its own visible axis.
   Conversely, a facet operator might explicitly request labels for the
   ORDINAL spaces it creates.

Keeping the axis tag separate from the space kind is what lets guide
selection happen as its own pass over the same tree. Without this
representation, systems tend to conflate the two decisions in scale
configuration, mark defaults, or chart-specific special cases.

## Discrete non-position channels

The tree is for spatial channels (x and y). Discrete non-position
channels — color, symbol, texture, stroke pattern, marker shape — don't
create an underlying spatial structure and aren't represented here. They
still need shared resolution (categories should map consistently across
a graphic; users should be able to override defaults; operators should
be able to introduce or delimit scopes), but the right model is closer
to a theming API than to axis inference: a discrete color or symbol
channel resolves by looking up a category in an inherited theme scope,
with local operators or marks able to override the palette.

The current code does this with a `unit.color` map on `scaleContext`
(seeded by `resolveColorScale` in `_node.ts`), which is enough for
GoFish today but is not yet a general theming system. Future work.

## Adding a new operator

Three things to consider:

1. **What kinds of children does it expect?** If your operator only ever
   sees POSITION children, you don't need to handle SIZE composition.
   If it can be the parent of a data-driven stack, you do.
2. **What kind does it produce?** Pick the most informative kind that
   honestly describes the result. A spread-style operator that lays
   children out side-by-side without summing should keep SIZE composition
   along its stack direction. An operator that fixes children to specific
   coordinates should produce POSITION. An operator that introduces a
   categorical axis should produce ORDINAL.
3. **Does it transform spaces or merely pass them through?** A coord
   transform annotates without changing the kind. `enclose` and `wrap`-
   style overlays use `unionChildSpaces`. `position` is a pass-through.
   Match the existing patterns in
   [`graphicalOperators/`](../packages/gofish-graphics/src/ast/graphicalOperators)
   and don't reinvent the merge logic per-operator.

If your operator is layout-time-only (no contribution to the kind tree),
return `[UNDEFINED, UNDEFINED]` and rely on the children to drive
inference upward through your wrapper (e.g. via `unionChildSpaces` from
a parent layer).

## Prior art

The general lesson — that graphical structure determines scale
structure — is shared with Vega-Lite's resolver, Observable Plot's
distributed inference, and Atom's recursive layout (Park et al. 2017).
GoFish's contribution is generalizing that lesson into an explicit
per-node intermediate representation rather than a set of
operator-specific conventions. Anyone can add an operator that
contributes, transforms, or consumes underlying-space facts; nothing in
the layout, posScale, or guide pipelines is privileged.

The design also borrows from compiler architecture, especially typed
intermediate representations and the value of an explicit elaboration
pass that turns a convenient surface specification into a more precise
representation that later passes can consume without re-inferring the
same facts. The connection to bidirectional typing (Dunfield & Krishnaswami 2021) is intentionally loose: GoFish similarly benefits from separating
local facts from contextual constraints, but it is not a type checker
and does not follow the bidirectional discipline directly.

For a longer treatment, see the "Underlying Space Tree" section of
GoFish's thesis chapter (parts/theory/underlying-space.typ in the
companion thesis repo).

## Pointers

- The data definitions and constructors:
  [`packages/gofish-graphics/src/ast/underlyingSpace.ts`](../packages/gofish-graphics/src/ast/underlyingSpace.ts).
- The traversal driver:
  [`_node.ts`'s `resolveUnderlyingSpace()`](../packages/gofish-graphics/src/ast/_node.ts).
- Per-shape resolvers:
  `packages/gofish-graphics/src/ast/shapes/{rect,ellipse,petal,text,image}.tsx`.
- Per-operator resolvers (each colocated with the operator):
  `packages/gofish-graphics/src/ast/graphicalOperators/{spread,layer,scatter,enclose,porterDuff,position,connect,arrow,table,coord}.tsx`.
- Overlay union helpers:
  [`graphicalOperators/alignment.ts`](../packages/gofish-graphics/src/ast/graphicalOperators/alignment.ts).
- The Monotonic algebra used by SIZE composition:
  [`util/monotonic.ts`](../packages/gofish-graphics/src/util/monotonic.ts).
- Layout consumption:
  [`gofish.tsx`'s `layout()`](../packages/gofish-graphics/src/ast/gofish.tsx)
  for root-level dispatch;
  [`spread.tsx`'s `layout`](../packages/gofish-graphics/src/ast/graphicalOperators/spread.tsx)
  for the per-node `computeScaleFactor`.
- Companion factory docs:
  [`docs/createMark.md`](./createMark.md),
  [`docs/createOperator.md`](./createOperator.md).
