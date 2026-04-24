# Operators as Traversals: a typeclass view of the v3 pipeline

Working notes on what `Mark<T>`, `Operator<T,U>`, and `chart().flow().mark()` _are_
as a categorical structure, and what that implies for the public API.

Async and node-mutation caveats are ignored throughout; read everything as if
`Mark<T> = T → Node` is a pure function and `Node` values are immutable.

## 1. The core types, stripped down

```
Mark<T>       = T → Node
Operator<T,U> = Mark<U> → Mark<T>
              = (U → Node) → (T → Node)
```

Two observations set the stage:

1. `Mark<->` is the representable presheaf `Hom(-, Node)` — covariant in `Node`,
   contravariant in `T`. Fix `Node` and it's an ordinary contravariant functor
   on types.
2. `Operator<T,U>` is therefore a morphism **between presheaves**: take a way of
   turning `U`s into nodes, produce a way of turning `T`s into nodes. Direction
   of data flow is `T → U`, but direction of function arrow is `Mark<U> → Mark<T>`.

> **Aside: what is a presheaf?**
> A _presheaf_ on a category `C` is a contravariant functor `C^op → Set` — a rule
> that assigns a set to every object of `C` and, for every morphism `f: A → B`,
> a function going the _other way_, `F(B) → F(A)`. The canonical family of
> examples is `Hom(-, X) : C^op → Set`, called the **representable presheaf at
> `X`**: it sends an object `A` to the set of morphisms `A → X`, and a morphism
> `f: A → B` to the precomposition map `(B → X) ↦ (A → B → X)`.
>
> In our setting `C` is the category of types (with functions as morphisms) and
> `X = Node`. So `Mark<-> = Hom(-, Node)` sends each type `T` to the set of
> functions `T → Node`, and sends a function `f: T → U` to the precomposition
> `Mark<U> → Mark<T>, m ↦ m ∘ f`. That's literally what `derive(f)` does, which
> is why `derive` ≅ `arr`: it's the presheaf's own action on morphisms, reified
> as a public combinator. Everything else in this doc — operators as morphisms
> between presheaves, profunctor optics, the traversal shape — is naming the
> extra structure that sits on top of this one presheaf `Hom(-, Node)`.

Composition of operators is just function composition of CPS transforms, and
this gives a category:

- **objects**: types
- **morphisms**: `Operator<T,U>`
- **identity**: `m => m`
- **composition**: `op1 ∘ op2 = m ↦ op1(op2(m))`

`chart.ts:323-326` builds exactly this composition by folding the operator list
in reverse.

## 2. The baseline: Reader applicative

In a bare `chart(data).mark(m)` with no operators, data threading is the plain
**Reader applicative** at environment type `T`:

```
F[A] = T → A
pure(a)      = _ ↦ a
ap(f)(x)(t)  = f(t)(x(t))
```

`Mark<T> = F[Node]`. The lift that started this conversation —
`node → (t ↦ node)` — is literally Reader's `pure`.

This is useful already: n-ary node combinators (`Stack`, `Layer`, `Spread` in its
combinator form) lift through the applicative to n-ary combinators of marks.
Every child sees the same environment, in parallel, with no sequencing. That's
the _right_ ceiling: a monad would let later marks read values produced by
earlier marks, which is deliberately not what the pipeline does.

## 2.5 Two dual mechanisms: applicative zip vs traversal

The same layout combinator (`Spread`, `Stack`, ...) appears in two different
call shapes, and they are categorically different things. The current API
overloads the same name on both, which is easy to miss.

**Combinator form** — `spread(opts, [m_1, ..., m_n])`, `chart.ts:437-461`:

```
spread_comb(opts, [m_1..m_n])(d) = Spread(opts, [m_1(d), m_2(d), ..., m_n(d)])
```

Every child mark sees the same `d`. The container is a fixed `n`-tuple; the
"partition" is the diagonal `d ↦ (d, d, ..., d)`; the variation is across
**marks**. This is Reader-applicative's n-ary lift of the pure node combinator
`Spread : [Node] → Node`, i.e. `liftA_n(Spread)`. No data-shape information is
needed — if `Spread` were commutative you could reorder or drop children with
no data-driven reasoning.

**Operator form** — `spread("category", opts)` inside `.flow()`, `chart.ts:479-524`:

```
spread_op(field)(mark)(d) = Spread(opts, Map.map(groupBy(d, field), mark))
```

One mark, applied to different data partitions. The container is `Map<K, _>`
via `groupBy`; the partition is data-dependent; the variation is across
**data**. This is the traversal shape that §3 covers in detail.

The two are **dual** in a precise sense — exchange "marks" and "data":

| form       | variation across | container `F`              | categorical shape           |
| ---------- | ---------------- | -------------------------- | --------------------------- |
| combinator | marks            | fixed `n`-tuple (diagonal) | applicative zip (`liftA_n`) |
| operator   | data partitions  | `Map` / `List` / `Grid`    | traversal                   |

Both end in the same layout algebra `F[Node] → Node`, which is why the public
names are currently shared. But the mechanisms are genuinely different: the
combinator form doesn't need a partition function (the diagonal is free), and
the operator form doesn't need a list of marks (there is just one).

`derive` is the degenerate **traversal** (identity `F`, pure function `T → U`).
There is no degenerate combinator form — it is always about combining `n ≥ 2`
pre-built marks, and the `n = 1` case collapses to identity.

## 3. What operators actually do: the traversal shape

The plain Reader story covers the no-operator case. Operators _refine_ it.
Look at any non-`derive` operator — `spread`, `stack`, `scatter`, `table`,
`group` — and the body has the same three-step skeleton:

```
d : T[]
  ─ split ─▶   F[T[]]       // F is a container: List, Map, Grid
  ─ mark  ─▶   F[Node]       // apply the child mark leaf-wise
  ─ combine▶   Node          // layout algebra F[Node] → Node
```

The container `F` and the algebra `F[Node] → Node` are chosen by the operator.
The mark in the middle is used polymorphically — the operator doesn't look
inside it.

| operator  | split `T[] → F[T[]]`         | F              | combine `F[Node] → Node` |
| --------- | ---------------------------- | -------------- | ------------------------ |
| `derive`  | pure `T → U`                 | `Id`           | identity                 |
| `spread`  | `groupBy(field)` or identity | `Map` / `List` | `Spread(...)`            |
| `stack`   | same as spread               | `Map` / `List` | `Spread(spacing: 0)`     |
| `scatter` | `groupBy` or per-item        | `Map` / `List` | `Scatter(...)`           |
| `table`   | cross-product on `(x, y)`    | `Grid`         | `Table(...)`             |
| `group`   | `groupBy(field)`             | `Map`          | `Frame(...)`             |

"Split-combine" is an informal name for this pattern. It has two established
homes in the PL literature, and you'll recognise the shape in either:

- **Recursion schemes.** `split : T[] → F[T[]]` is an F-coalgebra,
  `combine : F[Node] → Node` is an F-algebra, and gluing them by `fmap mark`
  in the middle is a **hylomorphism** — see Meijer, Fokkinga & Paterson,
  _Functional Programming with Bananas, Lenses, Envelopes and Barbed Wire_
  (1991). The "container `F` with leaves" framing matches Abbott, Altenkirch
  & Ghani, _Containers: Constructing Strictly Positive Types_ (2005).
- **Traversals, in profunctor optics.** The same shape factors as
  `traverse = dist ∘ fmap` — Gibbons & Oliveira, _The Essence of the Iterator
  Pattern_ (2009). In Van Laarhoven form:

  ```haskell
  Traversal s t a b = forall f. Applicative f ⇒ (a → f b) → (s → f t)
  ```

  Plugging in `s = t = T[]`, `a = b = T[]`, and reading `Mark<T[]>` as the
  effectful action, the operator is a function `Mark<T[]> → Mark<T[]>` that
  distributes the inner mark across a container `F`.

Both views describe the same thing from different entry points — the recursion
schemes view emphasises the split and combine as named arrows, the traversal
view emphasises the polymorphic distribution. For the API cleanup, the
recursion-schemes vocabulary is closer to what the code does; for formal
analysis the traversal view generalises more cleanly.

Two consequences matter:

- **Containers compose, but on the node-aggregation side only.** Nesting
  `spread("cat")` inside `spread("sub")` does _not_ nest the data environment:
  the inner mark still receives a plain `T[]`, namely one subgroup of the
  outer partition, not the full original dataset or a nested `Map<Cat, Map<Sub, T[]>>`.
  What nests is the container on the **node** side. The outer operator's
  combine step `Spread[Map<CatKey, _>]` wraps the inner operator's
  `Spread[Map<SubKey, _>]`, so the composed traversal's container is `Map ∘ Map`.
  Container composition of applicatives is still applicative, which is what
  lets the traversal ceiling survive arbitrary nesting — but data narrows
  as you descend, it doesn't accumulate.
- **`derive` is the degenerate traversal.** `F = Id`, no splitting, no
  combining. It's the lens-shaped case. Equivalently, it's `arr : (T → U) → Op<T,U>`
  in the Hughes sense: operators form an `Arrow`, and `derive` is `arr`.

## 4. Profunctor reading

Generalising slightly, the signature

```
Operator<T,U> = Mark<U> → Mark<T>
```

is a map between two profunctor-like things. `Mark` is the profunctor
`Hom(-, Node)`; an operator is a morphism in a category of presheaves into `Node`.
Profunctor optics give a name to exactly this family:

- `derive` ↔ **Lens** (identity container, pure function `T → U`)
- `spread` / `stack` / `scatter` / `table` / `group` ↔ **Traversal**
  (container-shaped distribution of the inner mark)
- `select` / `.name()` ↔ **not optical** — a side-channel from names to nodes

If you squint, the whole operator surface is a DSL of optics over `T[]`. That
gives a clean story for the thesis: _the v3 API is a profunctor-optic pipeline
where marks are the profunctor and operators are optics chosen from a fixed
menu (lenses + container-specific traversals)._

## 5. API cleanup proposals

The cleanup payoff is: if operators really are optics, the surface should make
that obvious. Some directions, roughly ordered from "low-risk" to "structural".

### 5.1 Factor every operator through a single `createOperator`

Today each of `spread`/`stack`/`scatter`/`table`/`group` hand-rolls its own
dispatch between combinator and operator forms — and most of them only
implement one of the two. The right primitive is a factory that gives **both
modes uniformly** for every operator, built on the split-combine pattern from
§3. (Code below is written synchronously; threading `Promise` back is
mechanical.)

```ts
// Config for a dual-mode layout operator. The container F lives inline in the
// three F-using callbacks; TS can't abstract over it as a higher-kinded type.
type OperatorConfig<T, O, FMark, FLeaf, FNode> = {
  // --- Traversal (operator) form: how to partition data ---
  split: (d: T[], opts: O) => FLeaf; // FLeaf = F<T[]>
  fmapLeaf: (shape: FLeaf, fn: (leaf: T[]) => Node) => FNode; // FNode  = F<Node>
  // --- Combinator form: how to walk a shape of pre-built marks ---
  fmapMark: (shape: FMark, d: T[]) => FNode;
  // --- Shared layout algebra: F<Node> → Node ---
  combine: (nodes: FNode, opts: O) => Node;
};

function createOperator<T, O, FMark, FLeaf, FNode>(
  cfg: OperatorConfig<T, O, FMark, FLeaf, FNode>
): {
  (opts: O, marks: FMark): Mark<T>; // combinator form
  (opts: O): Operator<T[], T[]>; // traversal form
} {
  return ((opts: O, marks?: FMark) => {
    if (marks !== undefined) {
      return (d: T[]) => cfg.combine(cfg.fmapMark(marks, d), opts);
    }
    return (mark: Mark<T[]>) => (d: T[]) =>
      cfg.combine(cfg.fmapLeaf(cfg.split(d, opts), mark), opts);
  }) as any;
}
```

The container F isn't expressible as a higher-kinded type in TS, so each
instantiation pins the three shape parameters (`FMark`, `FLeaf`, `FNode`) to
concrete container types. That's the trade for not setting up the URI-based
HKT infrastructure: the generic parameters carry the shape, and the
type-checker can't enforce that `fmapLeaf`/`fmapMark` actually agree on F —
each config just has to be internally consistent.

Every layout operator then becomes a few lines:

```ts
const spread = createOperator<
  any,
  SpreadOpts & { by?: string },
  Mark<any>[],
  Map<any, any[]>,
  Map<any, Node>
>({
  split: (d, opts) =>
    opts.by
      ? Map.groupBy(d, (r: any) => r[opts.by!])
      : new Map(d.map((x, i) => [i, [x]])),
  fmapLeaf: (m, fn) => new Map([...m].map(([k, v]) => [k, fn(v)])),
  fmapMark: (marks, d) => new Map(marks.map((m, i) => [i, m(d)])),
  combine: (nodes, opts) => Spread(opts, [...nodes.values()]),
});

// stack is spread with spacing:0 — both modes inherit automatically
const stack = (opts: StackOpts, marks?: Mark<any>[]) =>
  spread({ ...opts, spacing: 0 }, marks as any);

const scatter = createOperator<
  any,
  ScatterOpts & { by?: string },
  Mark<any>[],
  any[][],
  Node[]
>({
  split: (d, opts) =>
    opts.by ? Object.values(groupBy(d, opts.by)) : d.map((x) => [x]),
  fmapLeaf: (groups, fn) => groups.map(fn),
  fmapMark: (marks, d) => marks.map((m) => m(d)),
  combine: (nodes, opts) => Scatter(opts, nodes),
});

const table = createOperator<
  any,
  TableOpts & { xBy: string; yBy: string },
  Mark<any>[][],
  any[][][],
  Node[][]
>({
  split: (d, opts) => crossProductGrid(d, opts.xBy, opts.yBy),
  fmapLeaf: (grid, fn) => grid.map((row) => row.map(fn)),
  fmapMark: (rows, d) => rows.map((row) => row.map((m) => m(d))),
  combine: (grid, opts) =>
    Table({ numCols: grid[0]?.length ?? 0, ...opts }, grid.flat()),
});

const group = createOperator<
  any,
  { by: string },
  Mark<any>[],
  Map<any, any[]>,
  Map<any, Node>
>({
  split: (d, opts) => Map.groupBy(d, (r: any) => r[opts.by]),
  fmapLeaf: (m, fn) => new Map([...m].map(([k, v]) => [k, fn(v)])),
  fmapMark: (marks, d) => new Map(marks.map((m, i) => [i, m(d)])),
  combine: (nodes) => Frame({}, [...nodes.values()]),
});

// derive stays bespoke — it has no layout algebra, so there's nothing for
// `combine` to do. It's the lens-shaped case outside of createOperator's scope.
const derive =
  <T, U>(fn: (d: T) => U): Operator<T, U> =>
  (mark) =>
  (d) =>
    mark(fn(d));
```

Three things fall out:

- **Every layout operator has both modes, uniformly.** `scatter`, `table`, and
  `group` gain combinator forms for free. `table({ numCols: 2 }, [[m1, m2], [m3, m4]])`
  is exactly the analogue of `spread(opts, [m1, m2, m3])` for grid-shaped
  layout, and there is no longer a split between "things with combinator form"
  and "things without".
- **Adding a new operator is: pick `split`, pick the two fmaps, pick `combine`.**
  The dual-mode dispatch falls out of the factory.
- **The container shape is declared in one place.** The generic parameters
  tell a reader what F the operator uses (`Map` for `spread`/`group`, `List`
  for `scatter`, `Grid` for `table`), matching the F column in §3's table.

The split-configuration lives in `opts` (`by`, `xBy`/`yBy`) rather than as a
positional argument. That keeps the combinator/operator dispatch clean: second
arg is either a marks shape (combinator) or absent (operator).

If you wanted the fully-abstract "any functor F" version instead of inline
fmaps, you'd reach for an `fp-ts`-style URI-encoded HKT:

```ts
interface Functor<F extends URIS> {
  map<A, B>(fa: Kind<F, A>, fn: (a: A) => B): Kind<F, B>;
}
```

Algebraically cleaner, but requires registering each container as a functor
through `URItoKind`. For a library of this size the inline-fmap version above
is the right tradeoff.

### 5.2 Separate pure data transforms from layout-shaped operators

Today `derive`, `normalize`, `repeat`, `chunk`, and `log` live alongside
`spread` / `scatter` / `table` under the "operators" umbrella, but they're
different animals. The pure transforms are arrows (`arr`); the layout operators
are traversals. Two ways to make this structural:

- **Type-level split**. `Operator<T,U>` could be a union of `PureOp<T,U>`
  (just a `T → U`) and `LayoutOp<T>` (a traversal with `T = U` in practice).
  `.flow()` then knows, at the type level, which kind is which, and `.derive()`
  vs `.spread()` aren't just differently-shaped operator producers.
- **Module split**. Keep one type, but put pure transforms under `flow.derive`
  / `flow.normalize` / ... and layout operators under `flow.spread` / `flow.table`
  / .... This is documentation-level only but makes the two roles obvious.

The type-level version is better for the thesis (the distinction _is_ real);
the module-level version is cheaper and good enough for most users.

### 5.3 Disambiguate the two dual mechanisms structurally, not by renaming

§2.5 shows that `spread(opts, marks[])` (combinator form / applicative zip)
and `spread(opts, { by: "field" })` (operator form / traversal) are
categorically different things. Earlier drafts of this doc proposed renaming
the traversal form to make the distinction visible at the call site — e.g.
`facet` for what today is `spread(field, opts)`. With `createOperator` from
§5.1 in place, that rename is no longer necessary, and the right cleanup is
structural.

**The dispatch is by second-arg shape.** `createOperator` returns a function
with two overloads:

- Combinator: second positional arg is a marks shape (`Mark[]`, `Mark[][]`, …).
- Traversal: no second positional arg; split behaviour is driven by an
  `opts.by` / `opts.xBy` / `opts.yBy` field.

`Mark[]` is an array and the traversal form takes no second positional arg at
all, so TS overload resolution is clean — there's no Mark-vs-SplitFn
ambiguity to worry about. (An earlier draft flagged one; it was wrong.)

**Every operator has both modes uniformly.** Once `spread`, `stack`,
`scatter`, `table`, and `group` are all built through `createOperator`,
`scatter(opts, [...])` works just like `spread(opts, [...])`, and
`scatter(opts)` works just like `spread(opts)`. There's no special case to
explain and no "combinator-only" or "operator-only" operators.

**Arg order is consistent.** Opts come first in both modes, which fixes the
real inconsistency in the current code (combinator form has opts-first,
operator form has field-first at `chart.ts:413-525`).

Concretely the surface becomes:

```ts
// Combinator form — second arg is a marks shape
spread({ dir: "x" }, [m1, m2, m3]);
stack({ dir: "y" }, [m1, m2, m3]);
scatter({ x: [10, 20, 30], y: [5, 10, 15] }, [m1, m2, m3]);
table({ numCols: 2 }, [
  [m1, m2],
  [m3, m4],
]);
group({}, [m1, m2, m3])
  // Traversal form — split configuration in opts, inside .flow()
  .flow(spread({ dir: "x", by: "category" }))
  .flow(stack({ dir: "y", by: "category" })) // = spread with spacing: 0
  .flow(scatter({ by: "category", x: "mpg", y: "hp" }))
  .flow(table({ xBy: "x", yBy: "y" }))
  .flow(group({ by: "category" }));
```

The names stay put; the distinction lives in the shape of the call.

Could a rename (`facet` for the traversal form) still be valuable on top of
this? Arguably yes — `facet` is already industry term-of-art in ggplot/Vega
and would make the data-partitioning intent visible at the call site even
without needing the reader to spot the missing second arg. But it's no
longer required to resolve ambiguity; it would be a pure readability choice,
and we've punted that decision to "later, if people ask".

### 5.4 Give `select` / `name` an explicit escape-hatch name

`select` and `name` are genuinely outside the applicative/traversal story: a
later mark reads values registered by an earlier mark, which is the one piece
of true sequencing in the pipeline. The API should admit that. Options:

- Rename to something that flags the effectful nature (`publish("bars")` /
  `subscribe("bars")`, or `layer("bars")` / `fromLayer("bars")`).
- Require `select` to appear inside a distinct builder step, e.g.
  `chart(data).flow(...).mark(...)` stays applicative, and `select` only
  works in a follow-up `.overlay(other => ...)` step. That draws a bright
  line between the optic-shaped core and the one place where ordering
  matters.

Option B is more invasive but pays the biggest clarity dividend. For the
thesis it lets you honestly say "the v3 pipeline is profunctor-optic _plus_
one explicit monadic overlay step" instead of apologising for `select`.

### 5.5 Expose the applicative-composition story for users

At every layer of the pipeline, the data environment is just a `T[]` and the
Reader applicative gives you `liftA_n` for combining independent marks against
it. The combinator form of §5.3 already covers the common case (combine marks
under a specific layout), but a more generic helper — `liftA2 : (Node × Node → Node) → Mark<T> × Mark<T> → Mark<T>`,
or an n-ary `parallel([m1, ..., mk]) : Mark<T> × ... × Mark<T> → Mark<T[]>` —
lets users compose marks without picking a layout primitive up front. Whether
this is worth surfacing depends on how often users ask for "two marks sharing
one faceted dataset" without a specific arrangement in mind.

## 6. What this does _not_ solve

- `select`/`name` still have to exist. The traversal story covers everything
  except the late-bound layer reference, and that stays monadic (or at best
  applicative-with-a-distinguished-environment) no matter how the surface is
  cleaned up.
- Keys (`${key}-${groupKey}`) are a Writer channel riding alongside the
  traversal. Benign, but if you want the thesis to state the structure
  precisely, call it `Writer[Path] ⊗ Reader[T[], -] ⊗ F`.
- Color/scale context (`scaleContext` in the renderer) is another shared
  environment. For pipeline-level reasoning it acts like extra Reader
  arguments; the traversal analysis is unchanged, but the total environment
  is `(T[], ScaleCtx, KeyCtx, ...)` not just `T[]`.

## 7. One-line summary

**The v3 operator category is an Arrow whose morphisms of interest are
profunctor-traversal-shaped: `(split: T[] → F[T[]], combine: F[Node] → Node)`
for a container applicative F, with `derive` as the degenerate lens case and
`select`/`name` as the single monadic escape hatch.** Matching the public API
to that sentence is the cleanup.
