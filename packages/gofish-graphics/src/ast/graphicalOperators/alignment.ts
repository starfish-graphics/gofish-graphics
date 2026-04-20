import { Placeable } from "../_node";
import {
  DIFFERENCE,
  ORDINAL,
  POSITION,
  UNDEFINED,
  isDIFFERENCE,
  isORDINAL,
  isPOSITION,
  isSIZE,
  UnderlyingSpace,
} from "../underlyingSpace";
import type { Size } from "../dims";
import * as Interval from "../../util/interval";

export type Alignment = "start" | "middle" | "end" | "baseline";

/**
 * Union child underlying spaces along one axis for overlay-style operators
 * (layer, Porter-Duff). Converts DIFFERENCE(w) children to POSITION([0, w])
 * so data-driven sizes contribute to the parent's domain. ORDINAL children
 * take precedence: if any child reports ORDINAL, returns ORDINAL(union of keys).
 */
export function unionChildSpaces(
  children: Size<UnderlyingSpace>[],
  axis: 0 | 1
): UnderlyingSpace {
  // ORDINAL with an empty/missing domain is a "no-position" placeholder
  // (e.g. from image shapes without a data-bound position), not a real axis.
  // Ignore those so sibling POSITION/DIFFERENCE contributions still count.
  const ordinals = children
    .map((c) => c[axis])
    .filter(isORDINAL)
    .filter((o) => o.domain && o.domain.length > 0);
  if (ordinals.length > 0) {
    const keys = new Set<string>();
    for (const ord of ordinals) {
      if (ord.domain) for (const k of ord.domain) keys.add(k);
    }
    return ORDINAL(Array.from(keys));
  }

  const intervals: ReturnType<typeof Interval.interval>[] = [];
  for (const child of children) {
    const space = child[axis];
    if (isPOSITION(space) && space.domain) {
      intervals.push(space.domain);
    } else if (isDIFFERENCE(space)) {
      intervals.push(Interval.interval(0, space.width));
    } else if (isSIZE(space)) {
      intervals.push(Interval.interval(0, space.value));
    }
  }
  if (intervals.length === 0) return UNDEFINED;
  return POSITION(Interval.unionAll(...intervals));
}

/**
 * Determine the underlying space for an alignment axis given child spaces and alignment mode.
 * Returns both the space and a flag indicating whether children came from SIZE space
 * (i.e. they have no inherent position — layout must align them).
 */
export function resolveAlignmentSpace(
  spaces: UnderlyingSpace[],
  alignment: Alignment
): { space: UnderlyingSpace; fromSize: boolean } {
  if (spaces.every((s) => isSIZE(s))) {
    const sizeValues = spaces.map((s) => (s as any).value as number);
    if (
      alignment === "start" ||
      alignment === "end" ||
      alignment === "baseline"
    ) {
      const intervals = sizeValues.map((v) => Interval.interval(0, v));
      return {
        space: POSITION(Interval.unionAll(...intervals)),
        fromSize: true,
      };
    }
    if (alignment === "middle") {
      return {
        space: DIFFERENCE(Math.max(...sizeValues.map((v) => Math.abs(v)))),
        fromSize: true,
      };
    }
    return { space: UNDEFINED, fromSize: true };
  }
  if (spaces.every((s) => isDIFFERENCE(s))) {
    return {
      space: DIFFERENCE(
        Math.max(...spaces.map((s) => (s as any).width as number))
      ),
      fromSize: false,
    };
  }
  if (spaces.every((s) => isPOSITION(s))) {
    const domain = Interval.unionAll(
      ...spaces.map(
        (s) => (s as any).domain as ReturnType<typeof Interval.interval>
      )
    );
    if (alignment === "middle") {
      return { space: DIFFERENCE(Interval.width(domain)), fromSize: false };
    }
    return { space: POSITION(domain), fromSize: false };
  }
  return { space: UNDEFINED, fromSize: false };
}

/**
 * Align children on a single axis using spread-style semantics.
 *
 * Guard: when children already have data-driven positions via posScale
 * (fromSize is false and alignment !== "middle"), skip — the children
 * already know where they belong.
 */
export function alignChildren(
  children: Placeable[],
  axis: 0 | 1,
  alignment: Alignment,
  size: number,
  posScale: ((v: number) => number) | undefined,
  fromSize: boolean
): void {
  // Skip when children have data-driven positions, unless they came from
  // SIZE space (no inherent position) or middle alignment forces centering.
  if (posScale && !fromSize && alignment !== "middle") return;

  const isFixed = (child: Placeable) => child.dims[axis].min !== undefined;
  const fixedChildren = children.filter(isFixed);

  const anchorMap = {
    start: "min",
    middle: "center",
    end: "max",
    baseline: "baseline",
  } as const;

  const getBaseline = (child: Placeable): number => {
    const dim = child.dims[axis];
    const anchor = anchorMap[alignment];
    if (anchor === "baseline") return 0;
    return dim[anchor] ?? dim.min ?? 0;
  };

  const baseline =
    fixedChildren.length > 0
      ? getBaseline(fixedChildren[0])
      : alignment === "middle"
        ? size / 2
        : posScale
          ? posScale(0)
          : 0;

  const placeAnchor = anchorMap[alignment];

  for (const child of children) {
    if (isFixed(child)) continue;
    child.place(axis, baseline, placeAnchor);
  }
}
