import { GoFishNode } from "../_node";
import { Direction, Size } from "../dims";

export type LabelPosition = 
  | "auto" 
  | "inside" 
  | "outside-start" 
  | "outside-end" 
  | "outside-center"
  | "below" 
  | "above" 
  | "left" 
  | "right";

export interface LabelConfig {
  position?: LabelPosition;
  offset?: number;
  minSpace?: number;
  preferInside?: boolean;
}

export interface ShapeInfo {
  type: "rect" | "ellipse" | "petal" | "line" | "area";
  dimensions: Size;
  direction?: Direction; // Primary direction for bars/lines
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
  if (config.position !== "auto" && config.position) {
    return config.position;
  }

  // For polar coordinates, prefer inside for small shapes, outside for large
  if (shape.coordinateSystem === "polar") {
    const area = shape.dimensions[0] * shape.dimensions[1];
    const threshold = context.chartBounds.width * context.chartBounds.height * 0.05;
    return area < threshold ? "inside" : "outside-end";
  }

  // For stacked shapes, prefer inside if space allows
  if (shape.isStacked) {
    const stackDim = shape.stackDirection ?? 1; // default to Y
    const size = shape.dimensions[stackDim];
    const minSize = config.minSpace ?? 20;
    
    if (size > minSize && config.preferInside !== false) {
      return "inside";
    }
    
    // For vertical stacks (bars), place outside based on available space
    if (shape.stackDirection === 1) {
      return context.availableSpace.bottom > context.availableSpace.top ? "below" : "above";
    } else {
      return context.availableSpace.right > context.availableSpace.left ? "right" : "left";
    }
  }

  // For spread shapes (like bar charts)
  if (shape.isSpread) {
    const spreadDim = shape.spreadDirection ?? 0; // default to X
    
    // Horizontal spread (bars going up/down) -> labels below
    if (spreadDim === 0) {
      return context.hasAxes ? "below" : "outside-center";
    }
    
    // Vertical spread (bars going left/right) -> labels left
    if (spreadDim === 1) {
      return context.hasAxes ? "left" : "outside-center";
    }
  }

  // For line/area charts with multiple series
  if ((shape.type === "line" || shape.type === "area") && context.isMultiSeries) {
    return "outside-end"; // End of line is typical for multi-line charts
  }

  // For single shapes or scatter plots
  if (shape.type === "rect" || shape.type === "ellipse") {
    const area = shape.dimensions[0] * shape.dimensions[1];
    const threshold = config.minSpace ?? 20;
    
    if (area > threshold * threshold) {
      return "inside";
    }
  }

  // Default fallback
  return "outside-center";
};

export const calculateLabelOffset = (
  position: LabelPosition,
  shapeSize: Size,
  config: LabelConfig = {}
): { x: number; y: number } => {
  const baseOffset = config.offset ?? 5;
  const [width, height] = shapeSize;

  switch (position) {
    case "inside":
      return { x: 0, y: 0 };
    case "outside-start":
      return { x: -width / 2 - baseOffset, y: 0 };
    case "outside-end":
      return { x: width / 2 + baseOffset, y: 0 };
    case "outside-center":
      return { x: 0, y: -height / 2 - baseOffset };
    case "below":
      return { x: 0, y: height / 2 + baseOffset };
    case "above":
      return { x: 0, y: -height / 2 - baseOffset };
    case "left":
      return { x: -width / 2 - baseOffset, y: 0 };
    case "right":
      return { x: width / 2 + baseOffset, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
};

export const shouldShowLabel = (
  shape: ShapeInfo,
  labelText: string,
  position: LabelPosition,
  config: LabelConfig = {}
): boolean => {
  const minSpace = config.minSpace ?? 20;
  
  // Very small shapes shouldn't have labels unless forced inside
  const area = shape.dimensions[0] * shape.dimensions[1];
  if (area < minSpace && position !== "inside") {
    return false;
  }

  // For inside positioning, check if text fits
  if (position === "inside") {
    const estimatedTextWidth = labelText.length * 8; // rough estimate
    const estimatedTextHeight = 12; // rough estimate
    
    return shape.dimensions[0] > estimatedTextWidth + 10 && 
           shape.dimensions[1] > estimatedTextHeight + 5;
  }

  return true;
};