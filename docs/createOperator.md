# `createOperator`: turning a layout into a v3 operator

`createOperator` is the factory that wraps a low-level layout node-builder
(`Spread`, `Scatter`, `Table`, `Frame`) and produces the high-level v3
operator (`spread`, `scatter`, `table`, `group`, plus `stack` as a thin
wrapper over `spread`) used inside `chart(...).flow(...)` and as a
combinator inside `.mark(...)`.

It lives at
[`packages/gofish-graphics/src/ast/marks/createOperator.ts`](../packages/gofish-graphics/src/ast/marks/createOperator.ts).

This doc explains what the factory does, why it has two call shapes, and how
to add a new operator. It assumes you've read
[`docs/createMark.md`](./createMark.md) — this is the same idea applied to
layout containers instead of leaf shapes.

If you want the categorical derivation behind it (functor, traversal,
hylomorphism, profunctor optics — and the original research these come from),
see [`notes/operator-typeclass.md`](../notes/operator-typeclass.md). The
present doc only uses those words once, in §6, with explanations.

## 1. The two call shapes every operator has

Every v3 layout operator is a single function that you can call in two ways:

```ts
// (A) Combinator form — pass marks directly:
spread({ dir: "x" }, [m1, m2, m3]);

// (B) Operator form — used inside .flow():
chart(data)
  .flow(spread({ by: "category", dir: "x" }))
  .mark(rect({ h: "value" }));
```

The two are duals of each other:

| form           | data            | marks        | meaning                                               |
| -------------- | --------------- | ------------ | ----------------------------------------------------- |
| **combinator** | one (shared)    | n            | "arrange these n marks horizontally"                  |
| **operator**   | one (split → n) | one (`mark`) | "for each group of data, build a mark; arrange those" |

In combinator form, you supply the marks; in operator form, you supply a
single mark and a `by` field, and the operator splits the data into one
sub-array per `by`-value, applies the mark to each sub-array, and lays out
the resulting nodes.

`createOperator` is the factory that produces _both_ forms from one config.
Disambiguation is by arg shape: a second positional argument means
combinator form; no second arg means operator form.

## 2. The split → fmap → combine shape

Pick any layout operator and you'll find the same three steps:

1. **Split.** Partition the data into pieces. For `spread`, this is
   "groupBy `by`-field"; for `table`, it's the cartesian product of two
   fields; for `group`, it's groupBy. For `scatter` with no `by`, it's
   "one piece per item".
2. **fmap.** Apply the user's mark to each piece, producing one
   `GoFishNode` per piece.
3. **Combine.** Hand the array of nodes to the low-level layout function
   (`Spread`, `Table`, `Scatter`, `Frame`), which positions them.

```
data ──split──▶ [piece₀, piece₁, …, pieceₙ]
                   │
                   ▼ (fmap)
                 [mark(piece₀), mark(piece₁), …, mark(pieceₙ)]
                   │
                   ▼ (combine = layout)
                 GoFishNode (the arranged children)
```

The combinator form does the same thing but inverted: data is shared, marks
are the array. The factory handles both with the same machinery — only the
"who is the array" question changes.

## 3. Anatomy of a `createOperator` call

From [`packages/gofish-graphics/src/ast/graphicalOperators/spread.tsx:430`](../packages/gofish-graphics/src/ast/graphicalOperators/spread.tsx):

```ts
export const spread = createOperator<any, SpreadOptions>(Spread, {
  split: ({ by }, d) =>
    by ? Map.groupBy(d, (r: any) => r[by]) : new Map(d.map((r, i) => [i, r])),
  channels: { w: "size", h: "size" },
});
```

Three pieces:

1. **The low-level layout function** — `Spread`, the existing
   `createNodeOperator`-built node builder that already knows how to position
   children along an axis. This is the **combine** step.
2. **`split(opts, d)`** — partition `d` into an ordered `Map<key, subdata>`.
   Insertion order matters (it determines layout order). When `by` is omitted,
   each item becomes its own one-element group.
3. **`channels`** (optional) — per-opt data-aware encodings. Same idea as
   `createMark`'s channels: `w: "size"` means the user can pass a field name,
   and the factory will apply `inferSize` before handing opts to `Spread`.

That's it. Both call shapes (operator and combinator) fall out of the
factory.

## 4. What happens at render time

### Operator form (`spread({ by, dir })` inside `.flow(...)`)

Walking [`createOperator.ts:391-415`](../packages/gofish-graphics/src/ast/marks/createOperator.ts):

1. **Split** — `cfg.split(opts, d)` partitions the input into a
   `Map<key, subdata>`. (Some operators, like `table`, also return `keys` —
   row/column labels that get merged into the layout opts.)
2. **fmap** — for each `(key, subdata)` entry, call the user's mark with
   that subdata and a parent-prefixed key (`${key}-${i}`). The result is
   resolved to a `GoFishNode`. `node.setKey(...)` makes downstream
   coordinators able to look it back up.
3. **Apply channels** — `applyChannels` runs `inferSize` / `inferPos` /
   `inferColor` on annotated opts. For an entry-flagged channel
   (`{type, entry: true}`), the inference runs once per split entry,
   producing an array of values (one per child); otherwise it aggregates
   over all of `d` and produces one value.
4. **Strip factory keys** — `by` and `debug` never reach the low-level
   layout; remove them from opts.
5. **Combine** — call the low-level `layout` with the encoded opts and the
   array of child nodes.

### Combinator form (`spread({ dir }, [m1, m2, m3])`)

Same machinery, simpler:

1. Apply each mark in `marks` to the same `d`. Marks may be any of:
   `Mark<T>` functions, already-resolved `GoFishNode`s (e.g. `ref(...)`),
   or a `Promise<Mark<T>[]>` (e.g. when produced by SolidJS `For(...)`).
2. Apply channels (no per-entry inference — there's no split).
3. Strip factory keys.
4. Combine.

## 5. Channels in operator opts

The factory's channel system mirrors `createMark`'s, with one extra spec
shape — entry-flagged channels:

```ts
channels: {
  w: "size",                          // aggregate over all data, one value
  x: { type: "pos", entry: true },    // per-entry, produces array of values
}
```

| spec                            | what it does                                                        |
| ------------------------------- | ------------------------------------------------------------------- |
| `"size"` / `"pos"` / `"color"`  | aggregate over all of `d`, produce one value (single number/string) |
| `{ type: "size", entry: true }` | run once per split entry, collect into array (one value per child)  |
| user passed an array            | already final form — pass through unchanged                         |

`scatter` uses `entry: true` for `x`/`y`/`xMin`/`xMax`/`yMin`/`yMax` so a
field name like `x: "miles"` becomes a per-group mean position
([`packages/gofish-graphics/src/ast/graphicalOperators/scatter.tsx:336`](../packages/gofish-graphics/src/ast/graphicalOperators/scatter.tsx)).

## 6. Why two forms — and the words for it

The two call shapes are not arbitrary. They correspond to two ways of
applying a function to a structure:

- **Combinator form** is **applicative-zip**. You have a structure of
  marks (an array) and a single value (the data). You apply each mark to
  the value and zip the results back into the structure. In Haskell terms,
  this is `(<*>)` for a fixed-shape container.
- **Operator form** is a **traversal**. You have a structure of values
  (the data, which `split` carves into a Map) and a single function (the
  mark). You apply the function to each value and reassemble the same
  structure. The factorisation `traverse = combine ∘ fmap ∘ split` is
  Gibbons & Oliveira's "essence of the iterator pattern."

The split → fmap → combine triple is also called a **hylomorphism** —
"unfold a structure, then fold it back with computation in between." The
unfold is `split`, the fold is `combine`, and `fmap` is the in-between
work. Hylos come from Meijer/Fokkinga/Paterson's _Bananas, Lenses,
Envelopes and Barbed Wire_ paper.

If you study profunctor optics, you'll see `Mark<T> = T → Node` is a
profunctor (contravariant in `T`, covariant in `Node`), and the operator
form is a profunctor traversal. Pickering/Gibbons/Wu's _Profunctor Optics_
is the formal setting. None of this is required to use or extend the
factory — it just means the design isn't ad-hoc.

These are all references for the curious; the factory's actual code is the
~80 lines at the bottom of `createOperator.ts`.

## 7. Adding a new operator: a worked example

Suppose you want a `wrap` operator that lays children out left-to-right
with line wrapping at a max width. (This isn't a real GoFish operator
today — it's an example.)

You already have the low-level node builder, `Wrap`, written with
`createNodeOperator`. Then:

```ts
export type WrapOptions = {
  by?: string;
  maxWidth: number;
  spacing?: number;
};

export const wrap = createOperator<any, WrapOptions>(Wrap, {
  split: ({ by }, d) =>
    by ? Map.groupBy(d, (r) => r[by]) : new Map(d.map((r, i) => [i, r])),
});
```

Both forms now work without further code:

```ts
// Operator form:
chart(items)
  .flow(wrap({ by: "category", maxWidth: 400 }))
  .mark(rect({ w: "size" }));

// Combinator form:
wrap({ maxWidth: 400 }, [m1, m2, m3, m4]);
```

If `Wrap` accepts a width-per-child, you'd add `channels: { width: "size" }`
so consumers can pass a field name there.

If your operator needs to feed extra data (like `colKeys`/`rowKeys`) into
the layout opts, return the wrapped `{entries, keys}` form from `split`
instead of a bare Map — see
[`table.tsx:228`](../packages/gofish-graphics/src/ast/graphicalOperators/table.tsx)
for an example.

## 8. The relationship with `createMark`

The two factories are siblings:

|                  | wraps                               | output                                    |
| ---------------- | ----------------------------------- | ----------------------------------------- |
| `createMark`     | a leaf shape (`Rect`, `Ellipse`, …) | a `Mark<T>` (one node from one datum)     |
| `createOperator` | a layout (`Spread`, `Scatter`, …)   | a dual-mode operator (one node from many) |

Both use channel annotations to encode opts; both produce `NameableMark`s
that support `.name(...)` and `.label(...)` chaining. `createOperator`'s
`NameableMark` also has a top-level `.render(container, opts)` method so
combinator-form callsites can render directly without going through
`chart()`.

Naming-wise: `createOperator` is the v3 factory; the low-level helper that
produces `Spread`, `Scatter`, etc. is `createNodeOperator`
([`withGoFish.ts:297`](../packages/gofish-graphics/src/ast/withGoFish.ts)).
The "node" prefix reflects that it returns a function whose output is a
single `GoFishNode`, not the v3 dual-mode shape.

## 9. Pointers

- The factory: [`packages/gofish-graphics/src/ast/marks/createOperator.ts`](../packages/gofish-graphics/src/ast/marks/createOperator.ts).
- Existing operators (each colocated with their low-level layout):
  - `spread` and `stack` — `graphicalOperators/spread.tsx:430`.
  - `scatter` — `graphicalOperators/scatter.tsx:336`.
  - `table` — `graphicalOperators/table.tsx:228`.
  - `group` — `graphicalOperators/frame.tsx:41`.
- The companion mark factory: [`docs/createMark.md`](./createMark.md).
- Categorical derivation and design history:
  [`notes/operator-typeclass.md`](../notes/operator-typeclass.md).
- Research references mentioned in §6:
  - Meijer, Fokkinga, Paterson (1991), _Functional Programming with
    Bananas, Lenses, Envelopes and Barbed Wire_.
  - Gibbons & Oliveira (2009), _The Essence of the Iterator Pattern_.
  - Pickering, Gibbons, Wu (2017), _Profunctor Optics: Modular Data
    Accessors_.
  - Abbott, Altenkirch, Ghani (2005), _Containers: Constructing Strictly
    Positive Types_.
