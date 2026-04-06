import type { JSX } from "solid-js";
import chroma from "chroma-js";
import type { GoFishNode } from "../_node";
import { getValue } from "../data";
import {
  type LabelPosition,
  type ShapeInfo,
  inferLabelPosition,
  calculateLabelOffset,
  resolveLabelText,
} from "./labelPlacement";

const INSIDE_POSITIONS = new Set<LabelPosition>(["inside"]);

/**
 * Resolve the fill color of a node to a CSS color string.
 * Checks scaleContext for category-key colors first, falls back to literal values.
 */
function resolveNodeFill(node: GoFishNode): string | null {
  if (node.color == null) return null;

  const colorValue = getValue(node.color);
  if (colorValue == null) return null;

  try {
    const scaleContext = node.getRenderSession().scaleContext;
    const resolved = (scaleContext as any)?.unit?.color?.get(colorValue);
    if (resolved) return resolved as string;
  } catch {
    // no session yet
  }

  return typeof colorValue === "string" ? colorValue : null;
}

/**
 * Compute an auto label color.
 * - Inside the shape: contrast against the fill (mix toward white on dark fills, black on light fills).
 * - Outside the shape: always on a white chart background, so mix the fill toward black for a
 *   readable dark tint that still relates to the bar color.
 */
function autoLabelColor(node: GoFishNode, position: LabelPosition): string {
  const fill = resolveNodeFill(node);

  if (INSIDE_POSITIONS.has(position)) {
    if (!fill) return "black";
    try {
      const luminance = chroma(fill).luminance();
      const target = luminance < 0.4 ? "white" : "black";
      return chroma.mix(fill, target, 0.6, "lab").hex();
    } catch {
      return "black";
    }
  }

  // Outside: label is on white background — darken the fill for contrast
  if (!fill) return "#333333";
  try {
    return chroma.mix(fill, "black", 0.5, "lab").hex();
  } catch {
    return "#333333";
  }
}

export function renderLabelJSX(node: GoFishNode): JSX.Element | null {
  if (!node._label || !node.intrinsicDims) return null;
  const datum = node.datum;
  if (datum === undefined) return null;

  const labelText = resolveLabelText(node._label.accessor, datum);
  if (!labelText) return null;

  const w = node.intrinsicDims[0].size ?? 0;
  const h = node.intrinsicDims[1].size ?? 0;

  const shapeType = (
    ["rect", "ellipse", "petal", "line", "area"].includes(node.type)
      ? node.type
      : "rect"
  ) as ShapeInfo["type"];

  const position = inferLabelPosition(
    { type: shapeType, dimensions: [w, h] },
    {
      chartBounds: { width: w, height: h },
      availableSpace: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    { position: node._label.position ?? "auto", offset: node._label.offset }
  );

  const offset = calculateLabelOffset(position, [w, h], {
    offset: node._label.offset,
  });

  const cx = (node.transform?.translate?.[0] ?? 0) + w / 2;
  const cy = (node.transform?.translate?.[1] ?? 0) + h / 2;

  // Use explicit color if provided, otherwise derive from the fill automatically
  const labelColor = node._label.color ?? autoLabelColor(node, position);

  return (
    <text
      transform="scale(1,-1)"
      x={cx + offset.x}
      y={-(cy + offset.y)}
      fill={labelColor}
      font-size={`${node._label.fontSize ?? 11}px`}
      text-anchor="middle"
      dominant-baseline="central"
      pointer-events="none"
    >
      {labelText}
    </text>
  );
}
