import { Direction, Size } from "../dims";

export type LabelAccessor<D = any> = string | ((d: D) => string);

export interface LabelOptions {
  position?: LabelPosition;
  fontSize?: number;
  color?: string;
  offset?: number;
  minSpace?: number;
  rotate?: number;
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

export type LabelSide = "inside" | "outside";
export type LabelEdge = "top" | "bottom" | "left" | "right";
export type LabelAlignment = "start" | "center" | "end";

/**
 * Label position — three optional dimensions separated by hyphens:
 *
 * `side-edge-align`
 *
 * - `side`: `inside | outside` — whether the label sits inside or outside the shape
 * - `edge`: `top | bottom | left | right` — which edge to anchor to
 * - `align`: `start | center | end` — alignment along the perpendicular axis
 *
 * All dimensions are optional (right-to-left): just `"outside"`, `"outside-top"`,
 * or the full `"outside-top-start"` are all valid.
 *
 * Defaults: side → `outside`, edge → `top`, align → `center`
 *
 * Alignment semantics:
 * - `outside-top` / `outside-bottom` / `inside-top` / `inside-bottom`:
 *   align is along x — `start` = left edge, `end` = right edge
 * - `outside-left` / `outside-right` / `inside-left` / `inside-right`:
 *   align is along y — `start` = top edge, `end` = bottom edge
 *
 * Special: `"inside"` with no edge defaults to center of shape.
 */
export type LabelPosition =
  | "auto"
  | LabelSide
  | `${LabelSide}-${LabelEdge}`
  | `${LabelSide}-${LabelEdge}-${LabelAlignment}`;

const SIDES = new Set<string>(["inside", "outside"]);
const EDGES = new Set<string>(["top", "bottom", "left", "right"]);
const ALIGNMENTS = new Set<string>(["start", "center", "end"]);

interface ParsedPosition {
  side: LabelSide;
  edge: LabelEdge | null;
  align: LabelAlignment;
}

/** Parse a resolved (non-auto) position into its three dimensions. */
function parseLabelPosition(
  position: Exclude<LabelPosition, "auto">
): ParsedPosition {
  const parts = (position as string).split("-");

  // Try to extract side, edge, align from left to right
  let side: LabelSide = "outside";
  let edge: LabelEdge | null = null;
  let align: LabelAlignment = "center";

  let i = 0;

  if (parts[i] && SIDES.has(parts[i])) {
    side = parts[i] as LabelSide;
    i++;
  }

  if (parts[i] && EDGES.has(parts[i])) {
    edge = parts[i] as LabelEdge;
    i++;
  }

  if (parts[i] && ALIGNMENTS.has(parts[i])) {
    align = parts[i] as LabelAlignment;
  }

  return { side, edge, align };
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
    return area < threshold ? "inside" : "outside-right";
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
        ? "outside-bottom"
        : "outside-top";
    } else {
      return context.availableSpace.right > context.availableSpace.left
        ? "outside-right"
        : "outside-left";
    }
  }

  if (shape.isSpread) {
    const spreadDim = shape.spreadDirection ?? 0;
    if (spreadDim === 0) {
      return context.hasAxes ? "outside-bottom" : "outside-top";
    }
    if (spreadDim === 1) {
      return context.hasAxes ? "outside-left" : "outside-top";
    }
  }

  if (
    (shape.type === "line" || shape.type === "area") &&
    context.isMultiSeries
  ) {
    return "outside-right";
  }

  if (shape.type === "rect" || shape.type === "ellipse") {
    const area = shape.dimensions[0] * shape.dimensions[1];
    const threshold = config.minSpace ?? 20;
    if (area > threshold * threshold) {
      return "inside";
    }
  }

  return "outside-top";
};

export const calculateLabelOffset = (
  position: LabelPosition,
  shapeSize: Size,
  config: LabelConfig = {}
): { x: number; y: number } => {
  if (position === "auto") return { x: 0, y: 0 };
  const baseOffset = config.offset ?? 10;
  const [width, height] = shapeSize;
  const { side, edge, align } = parseLabelPosition(
    position as Exclude<LabelPosition, "auto">
  );

  if (side === "outside") {
    switch (edge ?? "top") {
      case "top": {
        const xAlign =
          align === "start" ? -width / 2 : align === "end" ? width / 2 : 0;
        return { x: xAlign, y: height / 2 + baseOffset };
      }
      case "bottom": {
        const xAlign =
          align === "start" ? -width / 2 : align === "end" ? width / 2 : 0;
        return { x: xAlign, y: -(height / 2 + baseOffset) };
      }
      case "left": {
        const yAlign =
          align === "start" ? height / 2 : align === "end" ? -height / 2 : 0;
        return { x: -(width / 2 + baseOffset), y: yAlign };
      }
      case "right": {
        const yAlign =
          align === "start" ? height / 2 : align === "end" ? -height / 2 : 0;
        return { x: width / 2 + baseOffset, y: yAlign };
      }
    }
  }

  // side === "inside"
  if (edge === null) {
    // "inside" alone — dead center
    return { x: 0, y: 0 };
  }

  switch (edge) {
    case "top": {
      const xAlign =
        align === "start"
          ? -(width / 2 - baseOffset)
          : align === "end"
            ? width / 2 - baseOffset
            : 0;
      return { x: xAlign, y: height / 2 - baseOffset };
    }
    case "bottom": {
      const xAlign =
        align === "start"
          ? -(width / 2 - baseOffset)
          : align === "end"
            ? width / 2 - baseOffset
            : 0;
      return { x: xAlign, y: -(height / 2 - baseOffset) };
    }
    case "left": {
      const yAlign =
        align === "start"
          ? height / 2 - baseOffset
          : align === "end"
            ? -(height / 2 - baseOffset)
            : 0;
      return { x: -(width / 2 - baseOffset), y: yAlign };
    }
    case "right": {
      const yAlign =
        align === "start"
          ? height / 2 - baseOffset
          : align === "end"
            ? -(height / 2 - baseOffset)
            : 0;
      return { x: width / 2 - baseOffset, y: yAlign };
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
  const { side, edge, align } = parseLabelPosition(
    position as Exclude<LabelPosition, "auto">
  );

  const resolvedEdge = edge ?? (side === "inside" ? null : "top");

  // Horizontal edges (top/bottom): alignment is along x → maps directly to text-anchor
  if (
    resolvedEdge === "top" ||
    resolvedEdge === "bottom" ||
    resolvedEdge === null
  ) {
    if (align === "start") return "start";
    if (align === "end") return "end";
    return "middle";
  }

  // Vertical edges (left/right): text reads inward from the edge
  if (resolvedEdge === "left") return "start";
  if (resolvedEdge === "right") return "end";

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
    const [w, h] = shape.dimensions;
    const estimatedTextWidth = labelText.length * 8;
    const estimatedTextHeight = 12;

    if (position === "inside") {
      // Centered — must fit in both dimensions
      return w > estimatedTextWidth + 10 && h > estimatedTextHeight + 5;
    }

    const { edge } = parseLabelPosition(
      position as Exclude<LabelPosition, "auto">
    );

    // Edge-anchored inside labels: check the relevant dimension
    if (edge === "top" || edge === "bottom") {
      // Label sits at top/bottom interior — needs width to fit text, and enough height to not overlap center
      return w > estimatedTextWidth + 10 && h > estimatedTextHeight + 5;
    }
    if (edge === "left" || edge === "right") {
      // Label sits at left/right interior — needs height to fit text, and enough width
      return w > estimatedTextWidth + 10 && h > estimatedTextHeight + 5;
    }
  }

  return true;
};
