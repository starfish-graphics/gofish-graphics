Maintain a tree tracking the space associated with each node in the scenegraph. This will be used
for the domain resolution pass. We will merge the inferPosDomains and inferSizeDomains into a single
pass.

There are three kinds of spaces: position, interval, and nominal/ordinal. Position space is where a
point in space means something directly as data. Interval space is where differences/distances
between points are meaningful, but not absolute locations (such as in a streamgraph).
Nominal/ordinal spaces are where relative positions are meaningful (like above, below, left, right),
but not quantitatively meaningful like the other two spaces.

Some examples:

- A grouped bar chart's y-axis is positional.
- A stacked bar chart's y-axis is positional.
- A stacked bar chart's y-axis is ordinal/nominal when the spacing is non-zero.
- A stacked area chart's y-axis is positional.
- A streamgraph's y-axis is interval.

(Note that the ordinal/nominal case is essentially the current inferSizeDomains case. The position
case is the current inferPosDomains case. The interval case is currently not implemented.)

These cases yield the following rules:

in `stack`

- children are `position` and start/end alignment equals `position`
- children are `position` and middle alignment equals `interval`
- children are `position` and stacking (no spacing) equals `position`
- children are `position` and spreading (w/ spacing) equals `ordinal` (with each child remaining
  `position`, possibly with shared positions?)

Proposed datatype (naming TBD; using `UnderlyingSpace` for now)

```ts
// Core kinds of data space inferred for a channel/axis
export type UnderlyingSpaceKind = "position" | "interval" | "ordinal";

// Optional alignment context for operators like `stack`
export type Alignment = "start" | "middle" | "end";

// Encodes the space semantics carried by a scenegraph node's channel
export interface UnderlyingSpace {
  kind: UnderlyingSpaceKind;
  // If `ordinal`, spacing > 0 implies spreading; spacing == 0 implies stacking
  // For `position` and `interval`, spacing is ignored
  spacing?: number; // device or normalized units; 0 means none
  // Optional tag to group nodes that share ordinal buckets (e.g., grouped bars)
  ordinalGroupId?: string;
  // Friendly provenance for debugging/resolution traces
  source?: string; // e.g., 'stack:start', 'stack:middle', 'mark:rect:y'
}

export const POSITION: UnderlyingSpace = { kind: "position" };
export const INTERVAL: UnderlyingSpace = { kind: "interval" };
export const ORDINAL: UnderlyingSpace = { kind: "ordinal" };

// Helper: derive combined space for `stack` given children spaces, alignment, and spacing
export function spaceForStack(
  childSpaces: UnderlyingSpace[],
  alignment: Alignment,
  spacing: number
): UnderlyingSpace {
  // Assumption from notes: children are `position`
  // Rules:
  // - alignment start/end => position
  // - alignment middle    => interval
  // - spacing == 0        => position (stacking)
  // - spacing > 0         => ordinal (spreading); children remain position
  if (spacing > 0) {
    return { kind: "ordinal", spacing, source: `stack:${alignment}` };
  }
  if (alignment === "middle") {
    return { kind: "interval", source: "stack:middle" };
  }
  return { kind: "position", source: `stack:${alignment}` };
}

// Helper: tag children that participate in an ordinal spread (they themselves stay position)
export function tagOrdinalChildren(
  childSpaces: UnderlyingSpace[],
  ordinalGroupId: string
): UnderlyingSpace[] {
  return childSpaces.map((s) =>
    s.kind === "position" ? { ...s, ordinalGroupId } : s
  );
}
```

Notes

- `position` corresponds to the current inferPosDomains behavior.
- `ordinal` corresponds to the current inferSizeDomains behavior when spacing is non-zero.
- `interval` (e.g., streamgraph) is newly formalized here and used by `stack` with `middle` alignment.

# Refactor Progress

- [x] Add DataSpace types
- [x] Add resolveUnderlyingSpace method signatures
- [-] Implement resolveUnderlyingSpace for all shapes and operators - (rect, layer, stack)
  - [x] Stub out resolveUnderlyingSpace
  - [x] Split resolveUnderlyingSpace return into two axes
  - [x] Test abstract resolution kind on existing examples
  - [ ] Implement resolved values
  - [ ] replace inferPosDomains completely with resolveUnderlyingSpace
  - [ ] Test specific values on existing examples
  - [ ] Test continuous axes on all charts that currently have them. (And make sure they no longer
        appear where they shouldn't be.)
- [ ] **SHIP PR**
- [ ] Replace inferSizeDomains with discrete cases in resolveUnderlyingSpace
