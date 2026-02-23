import type { Placeable } from "../_node";
import { Axis, ConstraintRef, axisIndex, isPlacedOn } from "./shared";

export interface DistributeOptions {
  dir: Axis;
  spacing?: number;
  mode?: "edge-to-edge" | "center-to-center";
  order?: "forward" | "reverse";
}

export interface DistributeConstraint {
  type: "distribute";
  dir: Axis;
  spacing: number;
  mode: "edge-to-edge" | "center-to-center";
  order: "forward" | "reverse";
  children: ConstraintRef[];
}

export const createDistributeConstraint = (
  options: DistributeOptions,
  children: ConstraintRef[]
): DistributeConstraint => ({
  type: "distribute",
  dir: options.dir,
  spacing: options.spacing ?? 0,
  mode: options.mode ?? "edge-to-edge",
  order: options.order ?? "forward",
  children,
});

export function applyDistribute(
  constraint: DistributeConstraint,
  targets: Placeable[]
): void {
  const idx = axisIndex(constraint.dir);
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
        target.place({ [constraint.dir]: pos });
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
          [constraint.dir]: pos - (target.dims[idx].size ?? 0) / 2,
        });
        pos += constraint.spacing;
      }
    }
  }
}
