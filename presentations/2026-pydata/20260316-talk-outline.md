# A Grammar of More Graphics

## PyData Talk Outline — March 25, 2026 (30 min + 15 min Q&A)

### Framing

This talk is a **provocation**, not a product pitch. The claim: our graphics tools only cover a tiny fraction of the visual representations that scaffold human thought, and a compositional algebra can close that gap. GoFish is one attempt at that algebra. The audience should leave thinking about the problem space, not just the tool.

---

### Act 1: Why Graphics Matter (~5 min)

**Open:** "I love graphics. Specifically, I love how graphics scaffold our thinking."

Larkin & Simon (1987) — visual representations aren't decoration. They make certain inferences _easy_ that are hard in other representations. The spatial structure does cognitive work for you.

- One crisp example: table vs. diagram where the diagram makes a relationship instantly visible. Keep it tight — the audience should _feel_ the difference, not hear a lecture about it.

Incorporate slides 25-27 from this: https://cel.cs.brown.edu/csci-1377-s26/11_Multimedia_I.pdf

**The world of graphics is huge.** Quick montage — NYT, Nature/Science, data art, AMS, SGSP. People
design visual structure to scaffold all kinds of reasoning.

(I will pick this graphics but make a placeholder slide with a 3x2 grid for the images to go)

### Act 2: The Gap (~3 min)

**But the world of graphics we can reliably make with our tools is quite small.**

The Grammar of Graphics (and ggplot, altair, vega-lite) gives us a powerful but _bounded_ typology.
It's a taxonomy of charts, not a generative grammar. When you need something outside its vocabulary,
you fall off a cliff.

Helps us think in terms of bars and lines and areas, and yes some stuff about scales and colors and
coordinate systems, too. But it doesn't really help us reason about the structure of graphics in
order to apply these insights to new datasets and new visualization problems we haven't seen before.
(Even though that was theoretically what it was for! And what channels in the mark and channel model
was for!)

"That's what I've been working on — a grammar of _more_ graphics."

Introduce GoFish briefly. Open source, JS and Python. Don't dwell here — earn it with demos.

### Act 3: The Dissolve (~17 min)

This is the heart. A gradual escalation from familiar chart territory into diagram territory, where the boundary dissolves without the audience noticing.

**Step 1: A simple bar chart** (~3 min)

- Get the API under people's fingers. `Chart`, `mark`, basic GoFish syntax in a notebook.
- Familiar territory. Nobody's impressed yet. That's fine.

**Step 2: Facet it — but notice what facet actually is** (~3 min)

- Faceting isn't a special chart feature. It's spreading a chart-making _function_.
- The `mark` method doesn't take a shape — it takes a chart. You're composing charts inside charts.
- "This is obviously what you want. If you want a faceted bar chart, you just spread a bar chart function."

Uses the same spread function as the spread in the rectangles themselves

**Step 3: Charts in the mark method** (~3 min)
Very natural from Step 2 to make a bar chart function and then put that in the mark method instead.

This _also_ gives us a way to do stuff like scatter other charts to make a scatter pie the same way.
And that allows us to think about how to take some data structure with geo-located complex data and
make a scattering of nested charts from it.

**Step 3.5: Layering**

We can layer charts on top of each other. This is convenient for eg putting a regression line on a
scatterplot, but also for connecting elements of a previous layer, adding annotations, etc. You can
refer to previous layers in another layer.

**Step 4: Glyphs in the mark method** (~4 min)

- We can also actually put glyphs in the mark method! (And by glyph I mean something in a Layer)
- Box and whisker as a natural example. We can basically put the box and whisker in the mark method
  without changing the spread(s) to replace it.

**Step 5: The Planets** (~4 min)

- We can go even further and replace the box and whiskers with the planets from the planets diagram,
  keeping the outer spread structure (or something like that... the data would be slightly
  different)
- This starts to feel like a diagram... (not sure entirely where to go from here)

(TODO: this does qualitatively change the vibe of the chart significantly! How are the affordances
changing between this and a bar chart... maybe height vs area?)

**Step 6: You have choice**

Building off the scatterpie example, we also have the flower chart and balloon chart examples that
use similar data. Provided the structure is similar, we have some latitude to change the way we
present data to fit the occasion! (And there are tradeoffs of familiarity in these cases that might
make it harder to read, etc. It's worth thinking through that as well...)

But especially now that we have AI generation, it is becoming much "cheaper" to generate more
complex examples like this.

### Act 4: Wrap (~2 min)

- Don't oversell. "I think there's something here. The compositional algebra seems to unify things we've been treating as separate — charts and diagrams, static and interactive, small and complex."
- "I'm still figuring out where the boundaries are. I'd love to hear from you — in the Q&A, in the hallway, on GitHub — about where this does and doesn't match problems you actually have."
- `pip install gofish-graphics`, gofish.graphics, GitHub link.

### Q&A as Needfinding (15 min)

Use this deliberately. What people ask tells you what they need:

- "Can it do X?" → They have unmet needs. Write these down.
- "Why not just use Y?" → Your positioning isn't landing for them. Probe why.
- "How does it handle Z?" → They're evaluating it against real workflows.
- "Oh cool" + silence → The need isn't felt. That's data too.
