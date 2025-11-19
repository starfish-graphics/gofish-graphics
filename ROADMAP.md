# Public Roadmap

## Our Vision
We envision a world where we communicate technical information with representations --- graphics, presentations, computational documents --- that are expressive, alive, and deeply creative.

## Our Mission
GoFish helps people build expressive and effective visualizations with a composable and extensible language.

There are two pieces to this mission. The first is helping people make visualizations. The second is creating a great domain-specific language (DSL) for visualization. Our roadmap aims to address both of these subgoals.

## Our Near-Term Goals (1-3 months)

### Helping People

There are several important market segments that can benefit from a more expressive visualization library:
- business folks and data analysts can use more expressive visualizations to make more visually pleasing presentations and custom visualizations for bespoke datasets (https://eagereyes.org/blog/2024/paper-business-data-vis-beyond-boring).
- data artists can use more expressive libraries to make their bespoke visualizations more easily and rapidly
- scientists and engineers can use more expressive visualizations to make better graphics for their presentations and papers as well as for making better visualizations for their bespoke datasets

These groups are all important, but their needs and capabilities vary. For example, business folks and some data artists may not know how (or want) to program. Some data artists and journalists use JavaScript. Data analysts may use R or Python. Scientists and engineers may use Python or MATLAB.

While in the long-term we are interested in helping all of these folks, **in the short term we want to pick a single beachhead market to start with. We will switch to adjacent areas soon to gather more requirements and continue building out the library.**

Our current target users are **biologists.** We are interested in what visualizations they're trying to make, what visualization tools they use, and what their pain points are. We are also curious how visualization fits into the rest of their workflow.

Why biologists? The characteristics of our beachhead market are:
- Reasonably proficient in programming since we're shipping a visualization library not a GUI editor (for now).
- Prefer programming to direct manipulation interfaces. (See above.)
- Complex graphics are a *must* not just a nice to have. There should be a burning need.
- Easy access to the target group.
- Aligned with our vision, passions, and goals.

For this reason, we want to target some science or engineering market first, because it is most aligned with our vision and people in this domain are generally more familiar with coding tools than with direct manipulation editors for making charts.

Biologists are a natural subgroup within this market, because they make lots of bespoke graphics, which need to look nice for prestigious journals like _Science_ and _Nature_. Helping biologists allows us to tackle adjacent markets of other scientists and engineers later. Also, in contrast to other groups we could start with, we already have some previous experience talking with biologists about their visualization needs at the Broad and WHOI.

**Picking this market involves making some short-term tradeoffs.**
- Python > TypeScript & R. One big tradeoff here is picking between TypeScript, Python, and R as our primary API. Biologists (and many other groups of scientists and engineers) strongly favor Python over TS for their workflow.
- Static > Interactive/Animated. Interaction and animation are really cool and really important for some use cases, but for publishing in journals you can't use an interactive graphic. Therefore, in the short term we are not treating interaction/animation as being on the critical path. That doesn't mean we won't work on it at all though!

**Here are some concrete things we need to do:**
- Collect visualizations that are hard to make, but that we want to support.
- Identify five representative graphics to do really well.
- Create a Python API.

### Improving the Language

We will continue to improve the language in parallel to focusing specifically on a small set of visualizations. This will help us avoid overfitting. Here are some concrete things we want to do:

- Achieve chart parity with static Vega-Lite/Altair examples. Create a GoG library on top of the GoFish mid-layer.
- Create extensible APIs and documentation for marks, operators, and coordinate transforms.
- Achieve chart parity with PiCCL to add more useful operators and start working towards infographic examples.
- Achieve chart parity with Seaborn.
- Add a label API.
- Continue overall low-level polish towards a library that feels as nice as Typst, Lean, SolidJS, and Rust.

## Our Long-Term Goals

In the longer term we also care about these problems. Unlike our near-term goals, they may require more research (~3-6 months) to get the rough abstractions in a good spot.

- interaction/animation (based on Animated Vega-Lite, CAST+, and Vega Express)
- accessibility (based on Olli/Data Navigator/Benthic)
- performance on large datasets (based on Mosaic)
- integrate more custom layouts (we may move this to short-term depending on what five representative graphics we select)
