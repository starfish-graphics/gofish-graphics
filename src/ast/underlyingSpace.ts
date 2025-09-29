// Core kinds of data space inferred for a channel/axis
export type UnderlyingSpaceKind = "position" | "interval" | "ordinal";

// Optional alignment context for operators like `stack`
export type Alignment = "start" | "middle" | "end";

// Encodes the space semantics carried by a scenegraph node's channel
export type UnderlyingSpace = {
  kind: UnderlyingSpaceKind;
  // If `ordinal`, spacing > 0 implies spreading; spacing == 0 implies stacking
  // For `position` and `interval`, spacing is ignored
  spacing?: number; // device or normalized units; 0 means none
  // Optional tag to group nodes that share ordinal buckets (e.g., grouped bars)
  ordinalGroupId?: string;
  // Friendly provenance for debugging/resolution traces
  source?: string; // e.g., 'stack:start', 'stack:middle', 'mark:rect:y'
};

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
