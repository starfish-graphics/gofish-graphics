import { Direction, Size } from "../dims";

export type LabelAccessor<D = any> = string | ((d: D) => string);

export interface LabelOptions {
  position?: LabelPosition;
  fontSize?: number;
  color?: string;
  offset?: number;
  minSpace?: number;
}

export interface LabelSpec<D = any> extends LabelOptions {
  accessor: LabelAccessor<D>;
}

export function resolveLabelText(accessor: LabelAccessor, datum: any): string {
  if (typeof accessor === "function") return String(accessor(datum) ?? "");
  if (datum == null) return "";
  const obj = Array.isArray(datum) ? datum[0] : datum;
  return obj?.[accessor] != null ? String(obj[accessor]) : "";
}

export type LabelRelation = "inside" | "above" | "below" | "left" | "right";
export type LabelAlignment = "start" | "center" | "end";

/**
 * Label position, Tailwind-style:
 * - `"auto"` – infer the best position automatically
 * - `"above"` – relation only, alignment defaults to `center`
 * - `"above-start"` – relation + alignment joined by a hyphen
 *
 * Relations: `inside | above | below | left | right`
 * Alignments: `start | center | end`
 *
 * Alignment semantics:
 * - `above` / `below`: aligns along x — `start` = left edge, `end` = right edge
 * - `left` / `right`: aligns along y — `start` = top edge, `end` = bottom edge
 * - `inside`: aligns along x — `start` = near left edge, `end` = near right edge
 */
export type LabelPosition =
  | "auto"
  | LabelRelation
  | `${LabelRelation}-${LabelAlignment}`;

const RELATIONS = new Set<string>([
  "inside",
  "above",
  "below",
  "left",
  "right",
]);
const ALIGNMENTS = new Set<string>(["start", "center", "end"]);

/** Parse a resolved (non-auto) position into its relation and alignment. */
function parseLabelPosition(position: Exclude<LabelPosition, "auto">): {
  relation: LabelRelation;
  align: LabelAlignment;
} {
  const str = position as string;
  // Try splitting on the LAST hyphen so "above-start" → ["above", "start"]
  const idx = str.lastIndexOf("-");
  if (idx !== -1) {
    const rel = str.slice(0, idx);
    const aln = str.slice(idx + 1);
    if (RELATIONS.has(rel) && ALIGNMENTS.has(aln)) {
      return { relation: rel as LabelRelation, align: aln as LabelAlignment };
    }
  }
  // No valid suffix — treat the whole string as a relation with center alignment
  return { relation: str as LabelRelation, align: "center" };
}

export interface LabelConfig {
  position?: LabelPosition;
  offset?: number;
  minSpace?: number;
  preferInside?: boolean;
}

export interface ShapeInfo {
  type: "rect" | "ellipse" | "petal" | "line" | "area";
  dimensions: Size;
  direction?: Direction;
  coordinateSystem?: "linear" | "polar" | "bipolar";
  isStacked?: boolean;
  stackDirection?: Direction;
  isSpread?: boolean;
  spreadDirection?: Direction;
}

export interface LayoutContext {
  chartBounds: { width: number; height: number };
  availableSpace: { top: number; right: number; bottom: number; left: number };
  hasAxes?: boolean;
  isMultiSeries?: boolean;
}

export const inferLabelPosition = (
  shape: ShapeInfo,
  context: LayoutContext,
  config: LabelConfig = {}
): LabelPosition => {
  if (config.position && config.position !== "auto") {
    return config.position;
  }

  if (shape.coordinateSystem === "polar") {
    const area = shape.dimensions[0] * shape.dimensions[1];
    const threshold =
      context.chartBounds.width * context.chartBounds.height * 0.05;
    return area < threshold ? "inside" : "right";
  }

  if (shape.isStacked) {
    const stackDim = shape.stackDirection ?? 1;
    const size = shape.dimensions[stackDim];
    const minSize = config.minSpace ?? 20;

    if (size > minSize && config.preferInside !== false) {
      return "inside";
    }

    if (shape.stackDirection === 1) {
      return context.availableSpace.bottom > context.availableSpace.top
        ? "below"
        : "above";
    } else {
      return context.availableSpace.right > context.availableSpace.left
        ? "right"
        : "left";
    }
  }

  if (shape.isSpread) {
    const spreadDim = shape.spreadDirection ?? 0;
    if (spreadDim === 0) {
      return context.hasAxes ? "below" : "above";
    }
    if (spreadDim === 1) {
      return context.hasAxes ? "left" : "above";
    }
  }

  if (
    (shape.type === "line" || shape.type === "area") &&
    context.isMultiSeries
  ) {
    return "right";
  }

  if (shape.type === "rect" || shape.type === "ellipse") {
    const area = shape.dimensions[0] * shape.dimensions[1];
    const threshold = config.minSpace ?? 20;
    if (area > threshold * threshold) {
      return "inside";
    }
  }

  return "above";
};

export const calculateLabelOffset = (
  position: LabelPosition,
  shapeSize: Size,
  config: LabelConfig = {}
): { x: number; y: number } => {
  if (position === "auto") return { x: 0, y: 0 };
  const baseOffset = config.offset ?? 10;
  const [width, height] = shapeSize;
  const { relation, align } = parseLabelPosition(
    position as Exclude<LabelPosition, "auto">
  );

  switch (relation) {
    case "inside": {
      if (align === "start") return { x: -width / 2 + baseOffset, y: 0 };
      if (align === "end") return { x: width / 2 - baseOffset, y: 0 };
      return { x: 0, y: 0 };
    }
    case "above": {
      const xAlign =
        align === "start" ? -width / 2 : align === "end" ? width / 2 : 0;
      return { x: xAlign, y: height / 2 + baseOffset };
    }
    case "below": {
      const xAlign =
        align === "start" ? -width / 2 : align === "end" ? width / 2 : 0;
      return { x: xAlign, y: -height / 2 - baseOffset };
    }
    case "left": {
      const yAlign =
        align === "start" ? height / 2 : align === "end" ? -height / 2 : 0;
      return { x: -width / 2 - baseOffset, y: yAlign };
    }
    case "right": {
      const yAlign =
        align === "start" ? height / 2 : align === "end" ? -height / 2 : 0;
      return { x: width / 2 + baseOffset, y: yAlign };
    }
    default:
      return { x: 0, y: 0 };
  }
};

/** Derive the SVG text-anchor from the label position. */
export const getLabelTextAnchor = (
  position: LabelPosition
): "start" | "middle" | "end" => {
  if (position === "auto") return "middle";
  const { relation, align } = parseLabelPosition(
    position as Exclude<LabelPosition, "auto">
  );
  // For above / below / inside the alignment is along x → maps to text-anchor directly.
  if (relation === "above" || relation === "below" || relation === "inside") {
    if (align === "start") return "start";
    if (align === "end") return "end";
  }
  return "middle";
};

export const shouldShowLabel = (
  shape: ShapeInfo,
  labelText: string,
  position: LabelPosition,
  config: LabelConfig = {}
): boolean => {
  const minSpace = config.minSpace ?? 20;
  const isInside = (position as string).startsWith("inside");

  const area = shape.dimensions[0] * shape.dimensions[1];
  if (area < minSpace && !isInside) {
    return false;
  }

  if (isInside) {
    const estimatedTextWidth = labelText.length * 8;
    const estimatedTextHeight = 12;
    return (
      shape.dimensions[0] > estimatedTextWidth + 10 &&
      shape.dimensions[1] > estimatedTextHeight + 5
    );
  }

  return true;
};
