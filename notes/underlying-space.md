# Underlying Space

## What?

A data-driven graphic maps data space to visual space. Typically data space is described by a data
schema like `{lake: string, count: number}`. Visual space is typically described using shapes and
screen positions (i.e., SVG or Canvas attributes).

Most of the logic in GoFish lives in between data and visual space, for example computing scales and
performing layout. We use a data structure to keep
this logic organized that we call "underlying space."

Underlying space is a tree of spaces where each space currently has one of the following tags:

- position
- difference
- size
- ordinal
- undefined

(These map closely to Stevens's statistical data types, which is probably not a coincidence, but the
relationship isn't clear yet.)

## Space Types

**POSITION**: Represents data-driven positions. Each position space has a domain (interval) that maps data values to screen positions.

**DIFFERENCE**: Represents spaces where differences/distances are meaningful, but absolute locations are not. This is a weakening of POSITION - once a space is DIFFERENCE, it cannot be converted back to POSITION. (Speculative: DIFFERENCE may be aesthetic position + data-driven size, whereas POSITION is data-driven position. This is not yet confirmed and should not be used for implementation.)

**SIZE**: Represents shapes with data-driven sizes but undetermined positions. SIZE tracks a single numeric value (which can be negative, e.g., for negative bars). Unlike DIFFERENCE, SIZE spaces can be merged into POSITION spaces when alignment is determined (e.g., when bars are aligned to a baseline). Example: individual bars in a bar chart have SIZE, but the stack operator merges them into POSITION space for baseline alignment.

**ORDINAL**: Represents nominal/ordinal spaces where relative positions are meaningful (like above, below, left, right), but not quantitatively meaningful.

**UNDEFINED**: Represents spaces with no data-driven information.

## Why?

Here are some kinds of things we need to figure out about a graphic that underlying space helps us
answer:

If we overlay a scatterplot and a line chart in the same region of the screen (such as
drawing regression line), what should the axis domains be? What about when the two charts have
different data spaces on one axis (like in a dual axis chart)?

If we draw a bar chart with vertically centered bars, what is the y-axis?

If we create faceted chart regions, how should those faceted regions relate to each other?

What if an operator arranges shapes in free space, but those objects have data-driven sizes that
need to be scaled to fit the available screen space? (As when using the spread operator.)

In all of these cases, we have some information about data spaces and their encodings to positions
and sizes of shapes. Operators compose this information together to create more complex
relationships between data and visual space.

Underlying space keeps track of this information explicitly so that we can more easily write
algorithms that resolve scales and draw axes.

For example, to resolve scale domains in the case of the overlaid scatterplot and line chart, we
first have to determine whether the two charts' domains can be merged and then we can merge the
domains. This information is later used to draw axes for the combined chart. We need to store
intermediate results about these domains, and that's basically the role of the "underlying space" data
structure.
