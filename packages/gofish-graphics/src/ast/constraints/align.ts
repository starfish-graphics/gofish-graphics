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
  dir: Axis;
  alignment: Alignment;
  children: ConstraintRef[];
}

export interface AlignOptions {
  dir: Axis;
  alignment?: Alignment;
}

export const createAlignConstraint = (
  { dir, alignment = "start" }: AlignOptions,
  children: ConstraintRef[]
): AlignConstraint => ({
  type: "align",
  dir,
  alignment,
  children,
});

export interface AlignFallbackBaseline {
  start?: number;
  middle?: number;
  end?: number;
}

export function applyAlign(
  constraint: AlignConstraint,
  targets: Placeable[],
  fallback?: AlignFallbackBaseline
): void {
  const idx = axisIndex(constraint.dir);

  // Find baseline from first already-placed child, or default to 0
  let baseline: number;
  const placed = targets.find((t) => isPlacedOn(t, idx));

  if (constraint.alignment === "start") {
    baseline = placed ? placed.dims[idx].min! : (fallback?.start ?? 0);
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place(constraint.dir, baseline);
    }
  } else if (constraint.alignment === "middle") {
    baseline = placed ? placed.dims[idx].center! : (fallback?.middle ?? 0);
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place(constraint.dir, baseline, "center");
    }
  } else {
    // "end"
    baseline = placed ? placed.dims[idx].max! : (fallback?.end ?? 0);
    for (const target of targets) {
      if (isPlacedOn(target, idx)) continue;
      target.place(constraint.dir, baseline, "max");
    }
  }
}
