# Design of the High-Level Chart API

This level is the closest to the original GoG. But because we also have the mid- and low-level APIs,
we can make this level much more restrictive and less compositional. Our goal at this level is to
match user intentions of the form "I want to make a bar chart."

That being said, these charts still produce GoFish scenegraphs so they can be transformed by
coordinate systems, layered, added as marks to `chart` pipelines, etc. This preserves a lot (all?)
of the compositional power of the GoG.

## Do Less

The name of the game here is _do less_. Do less inference than you think. Cover fewer chart types
with one function call than you might want to. This keeps things readable and predictable. It also
makes contributing examples easier, because they don't have to be as general.

Inference at this level of abstraction also breaks down really quickly. What might work well for bar
charts or bars, lines, and areas, quickly breaks down for more complex charts like waffles, boxes,
and mosaics.

Chart names at this level carry semantic/pragmatic meaning. If we allow too much flexibility in e.g.
a bar chart, then the name "bar chart" loses its meaning.

## Leave Space for Chart-Type DSLs

Don't try to do too much in a flat API for things like waffles or mosaics. That's a nice space for a
domain-specific language (DSL) to express these charts. For example, the Atom grammar for unit
charts could be ported. Or we could port productplots. These are useful for collections of charts
that have hierarchical structure, but have domain-specific primitives with more restrictive
structure than the mid-level API.
