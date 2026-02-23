import type { Placeable } from "./_node";
import type { GoFishNode } from "./_node";
import type { GoFishAST } from "./_ast";

// --- Types ---

export type Axis = "x" | "y";
export type Alignment = "start" | "center" | "end";

/** Lightweight handle for referencing a named child inside .constrain() */
export type ConstraintRef = { readonly name: string };

export interface AlignConstraint {
  type: "align";
  axis: Axis;
  anchor: Alignment;
  children: ConstraintRef[];
}

export interface DistributeOptions {
  spacing?: number;
  mode?: "edge-to-edge" | "center-to-center";
  order?: "forward" | "reverse";
}

export interface DistributeConstraint {
  type: "distribute";
  axis: Axis;
  spacing: number;
  mode: "edge-to-edge" | "center-to-center";
  order: "forward" | "reverse";
  children: ConstraintRef[];
}

export type ConstraintSpec = AlignConstraint | DistributeConstraint;

// --- Factory ---

export const Constraint = {
  align(
    axis: Axis,
    anchor: Alignment,
    children: ConstraintRef[]
  ): AlignConstraint {
    return { type: "align", axis, anchor, children };
  },
  distribute(
    axis: Axis,
    options: DistributeOptions,
    children: ConstraintRef[]
  ): DistributeConstraint {
    return {
      type: "distribute",
      axis,
      spacing: options.spacing ?? 0,
      mode: options.mode ?? "edge-to-edge",
      order: options.order ?? "forward",
      children,
    };
  },
};

// --- Helpers ---

/** Convert axis name to dimension index (0 = x, 1 = y) */
const axisIndex = (axis: Axis): 0 | 1 => (axis === "x" ? 0 : 1);

/** Check if a placeable has been placed on a given axis */
const isPlacedOn = (p: Placeable, axisIdx: 0 | 1): boolean =>
  p.dims[axisIdx].min !== undefined;

// --- Resolution ---

/**
 * Build a name->ConstraintRef map from the named children of a node.
 */
export function collectConstraintRefs(
  children: GoFishAST[]
): Record<string, ConstraintRef> {
  const refs: Record<string, ConstraintRef> = {};
  for (const child of children) {
    if ("_name" in child && (child as GoFishNode)._name) {
      const name = (child as GoFishNode)._name!;
      refs[name] = { name };
    }
  }
  return refs;
}

/**
 * Apply constraints to a set of placeables.
 *
 * @param constraints - The constraint specs to apply in order
 * @param nameToPlaceable - Map from child name to its Placeable
 */
export function applyConstraints(
  constraints: ConstraintSpec[],
  nameToPlaceable: Map<string, Placeable>
): void {
  for (const constraint of constraints) {
    const targets = constraint.children
      .map((ref) => nameToPlaceable.get(ref.name))
      .filter((p): p is Placeable => p !== undefined);

    if (targets.length === 0) continue;

    if (constraint.type === "align") {
      applyAlign(constraint, targets);
    } else {
      applyDistribute(constraint, targets);
    }
  }
}

function applyAlign(constraint: AlignConstraint, targets: Placeable[]): void {
  const idx = axisIndex(constraint.axis);

  // Find baseline from first already-placed child, or default to 0
  let baseline: number;
  const placed = targets.find((t) => isPlacedOn(t, idx));

  if (constraint.anchor === "start") {
    baseline = placed ? placed.dims[idx].min! : 0;
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place({ [constraint.axis]: baseline });
    }
  } else if (constraint.anchor === "center") {
    baseline = placed ? placed.dims[idx].center! : 0;
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place({
        [constraint.axis]: baseline - (target.dims[idx].size ?? 0) / 2,
      });
    }
  } else {
    // "end"
    baseline = placed ? placed.dims[idx].max! : 0;
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place({
        [constraint.axis]: baseline - (target.dims[idx].size ?? 0),
      });
    }
  }
}

function applyDistribute(
  constraint: DistributeConstraint,
  targets: Placeable[]
): void {
  const idx = axisIndex(constraint.axis);
  const ordered =
    constraint.order === "reverse" ? [...targets].reverse() : targets;

  // Find starting position from first already-placed child, or 0
  const firstPlaced = ordered.find((t) => isPlacedOn(t, idx));
  let pos = firstPlaced ? firstPlaced.dims[idx].min! : 0;

  if (constraint.mode === "edge-to-edge") {
    for (const target of ordered) {
      if (isPlacedOn(target, idx)) {
        // Already placed: advance pos past it
        pos = target.dims[idx].max! + constraint.spacing;
      } else {
        target.place({ [constraint.axis]: pos });
        pos += (target.dims[idx].size ?? 0) + constraint.spacing;
      }
    }
  } else {
    // center-to-center
    for (const target of ordered) {
      if (isPlacedOn(target, idx)) {
        pos = target.dims[idx].center! + constraint.spacing;
      } else {
        target.place({
          [constraint.axis]: pos - (target.dims[idx].size ?? 0) / 2,
        });
        pos += constraint.spacing;
      }
    }
  }
}
