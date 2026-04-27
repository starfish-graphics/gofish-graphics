import type { Placeable } from "../_node";
import {
  Alignment,
  Axis,
  ConstraintRef,
  axisIndex,
  isPlacedOn,
} from "./shared";

export interface AlignConstraint {
  type: "align";
  x?: Alignment;
  y?: Alignment;
  children: ConstraintRef[];
}

export interface AlignOptions {
  x?: Alignment;
  y?: Alignment;
}

export const createAlignConstraint = (
  { x, y }: AlignOptions,
  children: ConstraintRef[]
): AlignConstraint => {
  if (x === undefined && y === undefined) {
    throw new Error(
      "Constraint.align: at least one of `x` or `y` must be specified"
    );
  }
  return { type: "align", x, y, children };
};

export interface AlignFallbackBaseline {
  start?: number;
  middle?: number;
  end?: number;
}

function applyAlignAxis(
  axis: Axis,
  alignment: Alignment,
  targets: Placeable[],
  fallback?: AlignFallbackBaseline
): void {
  const idx = axisIndex(axis);

  // Find baseline from first already-placed child, or default to 0
  let baseline: number;
  const placed = targets.find((t) => isPlacedOn(t, idx));

  if (alignment === "start") {
    baseline = placed ? placed.dims[idx].min! : (fallback?.start ?? 0);
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place(axis, baseline);
    }
  } else if (alignment === "middle") {
    baseline = placed ? placed.dims[idx].center! : (fallback?.middle ?? 0);
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place(axis, baseline, "center");
    }
  } else {
    // "end"
    baseline = placed ? placed.dims[idx].max! : (fallback?.end ?? 0);
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place(axis, baseline, "max");
    }
  }
}

export function applyAlign(
  constraint: AlignConstraint,
  targets: Placeable[],
  fallback?: { x?: AlignFallbackBaseline; y?: AlignFallbackBaseline }
): void {
  if (constraint.x !== undefined) {
    applyAlignAxis("x", constraint.x, targets, fallback?.x);
  }
  if (constraint.y !== undefined) {
    applyAlignAxis("y", constraint.y, targets, fallback?.y);
  }
}
