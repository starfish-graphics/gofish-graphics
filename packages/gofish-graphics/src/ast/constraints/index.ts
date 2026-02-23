import type { GoFishAST } from "../_ast";
import type { GoFishNode, Placeable } from "../_node";
import { applyAlign, createAlignConstraint } from "./align";
import {
  applyDistribute,
  createDistributeConstraint,
} from "./distribute";
import type { AlignConstraint, AlignOptions } from "./align";
import type { DistributeConstraint, DistributeOptions } from "./distribute";
import type { ConstraintRef } from "./shared";

export type { Axis, Alignment, ConstraintRef } from "./shared";
export type { AlignConstraint, AlignOptions } from "./align";
export type { DistributeConstraint, DistributeOptions } from "./distribute";

export type ConstraintSpec = AlignConstraint | DistributeConstraint;

// --- Factory ---

export const Constraint = {
  align(options: AlignOptions, children: ConstraintRef[]): AlignConstraint {
    return createAlignConstraint(options, children);
  },
  distribute(
    options: DistributeOptions,
    children: ConstraintRef[]
  ): DistributeConstraint {
    return createDistributeConstraint(options, children);
  },
};

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
