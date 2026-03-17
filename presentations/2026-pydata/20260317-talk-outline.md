# A Grammar of More Graphics — PyData Talk Outline

## March 25, 2026 (30 min + 15 min Q&A)

### Framing

The through-line: **A visualization is a data structure you query with your eyes.** Making a good figure isn't about picking the right chart type — it's about being deliberate about that structure so it affords the queries your reader needs. GoFish is a tool that lets you make structural moves fluidly.

### Opening: What's the first thing you see? (~5 min)

Start with the Franconeri grouped bar chart example. Same data, grouped two different ways. Ask the audience: what comparison is easy in this one? What about this one?

Anchor this with Boger & Franconeri (2024): [Reading a Graph Is Like Reading a Paragraph](https://par.nsf.gov/servlets/purl/10552630).

The data didn't change. The structure did. And that changed what you could _query_ at a glance.

"A visualization is a data structure you query with your eyes."

This is Larkin & Simon (1987) made concrete — visual representations aren't decoration, they make certain inferences easy that are hard otherwise. The spatial structure does cognitive work for you.

Quick montage: NYT, Nature/Science, data art. People design visual structure to scaffold all kinds of reasoning. The world of graphics is huge.

**But our tools mostly help us pick chart types — bar, line, area, pie. That's a typology, not a grammar. It doesn't help us reason about _structure_.** That's what I've been working on.

Introduce GoFish in one sentence. Open source, JS and Python. Earn it with what follows.

---

### Part 1: One dataset, many structures (~13 min)

One continuous evolution of the same dataset, in a **single walkthrough** where each step is a small structural move. Each move reshapes the structure, which reshapes the afforded queries.

#### Walkthrough scaffolding (repeatable slide pattern)

For each chart “step” in the walkthrough, keep a consistent set of slide beats (this is the bar → polar ribbon story, not a grab bag of chart types):

- **Slide: “Our GoFish spec”**: show the current spec (keep it readable and small). This is the running artifact that evolves across steps.
- **Slide: Step title + “what changed”**: one sentence naming the structural move (e.g., stack, unroll, wrap) relative to the previous spec.
- **Slide: Data schema (placeholder)**
- **Slide: Tasks / queries (placeholder)**
- **Slide: Chart**: show the chart rendered from the spec, with a callout of what queries it makes easy/hard.
- **Slide: The move**: the minimal edit to the spec/API that got us here (one diff / one line / one operator).

**Bar chart** (~2 min)

Get the API under people's fingers. `Chart`, `mark`, basic GoFish syntax. Familiar territory.

Even here: this chart has a _structure_. Position and length afford the query "which category has the largest value?" What queries does it make _hard_?

- **Data schema**: [placeholder]
- **Tasks / queries**: [placeholder]

**Stacked bar** (~2 min)

Same data, but now we've introduced a second level of grouping. What changed? Part-to-whole queries become possible — you can now ask "what fraction is this subcategory?" But direct comparison across subcategories got harder, because they no longer share a common baseline.

One structural move. New affordances gained, old ones traded away.

- **Data schema**: [placeholder]
- **Tasks / queries**: [placeholder]

**Ribbon** (~2 min)

Unroll the stacked bar into a ribbon. The stacking is still there — same part-to-whole structure. But now there's a continuous axis. Trend queries become possible: "how does this subcategory change over time?"

The structure is _almost_ the same as stacked bar, but that one added dimension (continuity) opens up a whole new family of queries.

- **Data schema**: [placeholder]
- **Tasks / queries**: [placeholder]

**Polar ribbon** (~2 min)

Wrap the ribbon around into polar coordinates. Same structure — different coordinate transform. Cyclical patterns become easy to see. Precise magnitude comparison gets harder.

Pause here: we've gone from bar chart to polar ribbon. These are four "chart types" that a typology treats as separate things. But we got between them through a small number of structural moves — stacking, extending, and wrapping. The structure evolved continuously. The chart type labels are just snapshots along the way.

- **Data schema**: [placeholder]
- **Tasks / queries**: [placeholder]

**Now add color and labels** (~3 min)

Go back across some of these forms and show how, keeping the structure fixed, color and label choices change which queries you're highlighting. Color a single subcategory across a stacked bar to make one comparison pop. Use labels to anchor a specific insight.

This is where the SWD-style advice lives — but now it's grounded in something precise. You're not "reducing clutter" as a vague principle. You're choosing which queries to _promote_ and which to _demote_, within a structure you understand.

- **Data schema**: [placeholder] (likely unchanged)
- **Tasks / queries**: [placeholder] (explicitly: what are we steering attention toward?)

**Interlude: what just happened** (~1 min)

We took one dataset and made a series of deliberate structural moves. Each move changed what was easy to see. None of these moves required picking from a menu — they were transformations of a continuous underlying structure.

---

### Part 2: Same structure, different glyphs (~10 min)

Hard reset. New dataset, new problem — but the same structural thinking.

**Scatterpie** (~3 min)

You have geo-located data with a compositional breakdown at each location. A natural move: scatter layout with pie glyphs at each point. The outer structure (spatial position) affords "where?" queries. The inner structure (pie) affords "what's the breakdown?" queries.

This is composition — the mark method takes a chart. Same idea as faceting. You're nesting one query-affording structure inside another.

- **Data schema**: [placeholder]
- **Tasks / queries**: [placeholder]

**Flower chart** (~2 min)

Same data, same outer scatter structure. But swap the inner glyph from pie to flower petals. Now the inner query changes — petal length affords magnitude comparison more than proportion comparison. You've changed what the reader can ask about each location without touching the layout.

- **Data schema**: [placeholder] (likely unchanged)
- **Tasks / queries**: [placeholder] (explicitly: what changed because the glyph changed?)

**Balloon chart** (~2 min)

Same move again. Balloon glyphs instead. Different affordances again — area encoding, maybe less precise but more compact.

- **Data schema**: [placeholder] (likely unchanged)
- **Tasks / queries**: [placeholder]

**The point: you have choice** (~3 min)

Three visualizations that a typology would treat as unrelated chart types. But they share the same outer structure and differ only in the inner glyph. Once you see it structurally, the choice becomes deliberate.

There are real tradeoffs: familiarity, legibility, what queries each form makes easy or hard. The point isn't that one is always better — it's that you have a choice you didn't know you had, and the query-affordance frame tells you how to make it.

And now that AI generation is getting cheaper, the cost of exploring these structural variations is dropping fast.

---

### Close (~2 min)

"Making a chart is more than showing your data. It's designing a data structure your readers will query with their eyes. Our tools should help us be deliberate about that structure — not just pick from a menu of chart types."

"GoFish is one attempt at that. I'm still figuring out where the boundaries are. I'd love to hear — in Q&A, in the hallway, on GitHub — about where this does and doesn't match problems you actually have."

`pip install gofish-graphics` / gofish.graphics / GitHub link.

---

### Q&A as Needfinding (15 min)

Use this deliberately. What people ask tells you what they need:

- "Can it do X?" → Unmet needs. Write these down.
- "Why not just use Y?" → Positioning isn't landing. Probe why.
- "How does it handle Z?" → They're evaluating against real workflows.
- "Oh cool" + silence → The need isn't felt. That's data too.
