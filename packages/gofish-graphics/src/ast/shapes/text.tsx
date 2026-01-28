import * as fontkit from "fontkit";
import * as Monotonic from "../../util/monotonic";
import { pathToSVGPath, transformPath, Path, segment, curve } from "../../path";
import { computeAesthetic } from "../../util";
import { interval } from "../../util/interval";
import { GoFishNode } from "../_node";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { linear } from "../coordinateTransforms/linear";
import {
  getValue,
  inferEmbedded,
  isAesthetic,
  isValue,
  MaybeValue,
} from "../data";
import { Dimensions, elaborateDims, FancyDims, Transform } from "../dims";
import { scaleContext } from "../gofish";
import {
  DIFFERENCE,
  ORDINAL,
  POSITION,
  SIZE,
  UNDEFINED,
} from "../underlyingSpace";
import { getEffectiveFontFamily } from "./fontUtils";

type TextDimensions = {
  width: number;
  height: number;
  ascent: number;
  descent: number;
};

let _measureCtx: CanvasRenderingContext2D | null | undefined;

const getMeasureContext = (): CanvasRenderingContext2D | null => {
  if (_measureCtx !== undefined) return _measureCtx;
  if (typeof document === "undefined") {
    _measureCtx = null;
    return _measureCtx;
  }
  const canvas = document.createElement("canvas");
  _measureCtx = canvas.getContext("2d");
  return _measureCtx ?? null;
};

const estimateTextDimensions = (
  text: string,
  fontSize: number,
  fontFamily: string
): TextDimensions => {
  const ctx = getMeasureContext();
  if (ctx) {
    // Measure using the same font-family that the <text> element will use.
    // (We omit weight/style for now since this mark API doesn't expose them.)
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const width = metrics.width;
    // Prefer font-level metrics for stable line height across strings.
    // actualBoundingBox* is glyph-dependent (e.g. descenders), which makes stacking look uneven.
    const ascent =
      (metrics as any).fontBoundingBoxAscent ??
      (metrics as any).actualBoundingBoxAscent ??
      fontSize * 0.8;
    const descent = -(
      (metrics as any).fontBoundingBoxDescent ??
      (metrics as any).actualBoundingBoxDescent ??
      fontSize * 0.2
    );
    const height = ascent - descent;
    return { width, height, ascent, descent };
  }

  // Non-DOM/SSR fallback: approximate based on font size.
  const avgCharWidth = fontSize * 0.6;
  const width = text.length * avgCharWidth;
  const ascent = fontSize * 0.8;
  const descent = -fontSize * 0.2;
  const height = ascent - descent;
  return { width, height, ascent, descent };
};

type FontLayout = {
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  advanceWidth: number;
  anchorEm: { x: number; y: number };
  scale: number;
  glyphs?: any[];
  positions?: any[];
  font?: any;
};

const rectPath = (x0: number, y0: number, x1: number, y1: number): Path => [
  segment([x0, y0], [x1, y0]),
  segment([x1, y0], [x1, y1]),
  segment([x1, y1], [x0, y1]),
  segment([x0, y1], [x0, y0]),
];

const resolveFontLayout = (
  font: any | undefined,
  text: string,
  fontSize: number,
  fontFamily: string,
  textAnchor: "start" | "middle" | "end",
  dominantBaseline: "auto" | "central" | "hanging" | "mathematical"
): FontLayout => {
  if (!font || !text) {
    const approx = estimateTextDimensions(text ?? "", fontSize, fontFamily);
    const bbox = {
      minX: 0,
      minY: approx.descent,
      maxX: approx.width,
      maxY: approx.ascent,
    };
    const anchorX =
      textAnchor === "middle"
        ? approx.width / 2
        : textAnchor === "end"
          ? approx.width
          : 0;
    let anchorY = 0;
    if (dominantBaseline === "central") {
      anchorY = (bbox.minY + bbox.maxY) / 2;
    } else if (dominantBaseline === "hanging") {
      anchorY = bbox.maxY;
    } else if (dominantBaseline === "mathematical") {
      anchorY = approx.ascent * 0.5;
    }

    return {
      bbox,
      advanceWidth: approx.width,
      anchorEm: { x: anchorX, y: anchorY },
      scale: 1,
    };
  }

  const run = font.layout(text);
  const glyphs = run.glyphs ?? [];
  const positions = run.positions ?? [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let cursorX = 0;
  let cursorY = 0;

  for (let i = 0; i < glyphs.length; i += 1) {
    const glyph = glyphs[i];
    const pos = positions[i] ?? {};
    const bbox = glyph?.bbox;
    const xOffset = pos.xOffset ?? 0;
    const yOffset = pos.yOffset ?? 0;

    if (bbox) {
      const glyphMinX = cursorX + xOffset + (bbox.minX ?? 0);
      const glyphMaxX = cursorX + xOffset + (bbox.maxX ?? 0);
      const glyphMinY = cursorY + yOffset + (bbox.minY ?? 0);
      const glyphMaxY = cursorY + yOffset + (bbox.maxY ?? 0);

      minX = Math.min(minX, glyphMinX);
      maxX = Math.max(maxX, glyphMaxX);
      minY = Math.min(minY, glyphMinY);
      maxY = Math.max(maxY, glyphMaxY);
    }

    const xAdvance = pos.xAdvance ?? glyph?.advanceWidth ?? 0;
    const yAdvance = pos.yAdvance ?? 0;
    cursorX += xAdvance;
    cursorY += yAdvance;
  }

  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = cursorX;
    minY = 0;
    maxY = 0;
  }

  const advanceWidth = cursorX;
  const unitsPerEm = font.unitsPerEm ?? 1000;
  const scale = fontSize / unitsPerEm;

  const anchorXEm =
    textAnchor === "middle"
      ? advanceWidth / 2
      : textAnchor === "end"
        ? advanceWidth
        : 0;

  let anchorYEm = 0;
  if (dominantBaseline === "central") {
    anchorYEm = (minY + maxY) / 2;
  } else if (dominantBaseline === "hanging") {
    anchorYEm = maxY;
  } else if (dominantBaseline === "mathematical") {
    const ascent = font.ascent ?? maxY;
    anchorYEm = ascent * 0.5;
  }

  const scaledBbox = {
    minX: minX * scale,
    minY: minY * scale,
    maxX: maxX * scale,
    maxY: maxY * scale,
  };

  return {
    bbox: scaledBbox,
    advanceWidth: advanceWidth * scale,
    anchorEm: { x: anchorXEm, y: anchorYEm },
    scale,
    glyphs,
    positions,
    font,
  };
};

const commandType = (command: any): string =>
  (command?.command ?? command?.type ?? "").toString();

const getCommandArgs = (command: any): number[] =>
  Array.isArray(command?.args) ? command.args : [];

const getCommandValue = (
  command: any,
  index: number,
  key: string
): number | undefined => {
  if (typeof command?.[key] === "number") return command[key];
  const args = getCommandArgs(command);
  const value = args[index];
  return typeof value === "number" ? value : undefined;
};

const toPoint = (
  x: number,
  y: number,
  scale: number,
  offsetX: number,
  offsetY: number
): [number, number] => [offsetX + x * scale, offsetY + y * scale];

const quadraticToCubic = (
  start: [number, number],
  control: [number, number],
  end: [number, number]
): { c1: [number, number]; c2: [number, number] } => {
  const c1: [number, number] = [
    start[0] + (2 / 3) * (control[0] - start[0]),
    start[1] + (2 / 3) * (control[1] - start[1]),
  ];
  const c2: [number, number] = [
    end[0] + (2 / 3) * (control[0] - end[0]),
    end[1] + (2 / 3) * (control[1] - end[1]),
  ];
  return { c1, c2 };
};

const buildTextPaths = (
  layout: FontLayout,
  origin: [number, number]
): Path[] => {
  if (!layout.font || !layout.glyphs || !layout.positions) return [];

  const paths: Path[] = [];
  const glyphs = layout.glyphs;
  const positions = layout.positions;
  const scale = layout.scale;
  const [originX, originY] = origin;

  let cursorX = 0;
  let cursorY = 0;

  for (let i = 0; i < glyphs.length; i += 1) {
    const glyph = glyphs[i];
    const pos = positions[i] ?? {};
    const glyphPath = glyph?.path;
    const commands = glyphPath?.commands ?? [];
    const offsetX =
      originX + (cursorX + (pos.xOffset ?? 0) - layout.anchorEm.x) * scale;
    const offsetY =
      originY + (cursorY + (pos.yOffset ?? 0) - layout.anchorEm.y) * scale;

    let currentPoint: [number, number] | null = null;
    let subpathStart: [number, number] | null = null;
    let currentPath: Path | null = null;

    for (const cmd of commands) {
      const cmdType = commandType(cmd).toUpperCase();
      if (cmdType === "M" || cmdType === "MOVETO") {
        if (currentPath && currentPath.length > 0) {
          paths.push(currentPath);
        }
        currentPath = [];
        const x = getCommandValue(cmd, 0, "x");
        const y = getCommandValue(cmd, 1, "y");
        if (x === undefined || y === undefined) {
          continue;
        }
        currentPoint = toPoint(x, y, scale, offsetX, offsetY);
        subpathStart = currentPoint;
        continue;
      }

      if (!currentPoint) continue;

      if (cmdType === "L" || cmdType === "LINETO") {
        const x = getCommandValue(cmd, 0, "x");
        const y = getCommandValue(cmd, 1, "y");
        if (x === undefined || y === undefined) {
          continue;
        }
        const nextPoint = toPoint(x, y, scale, offsetX, offsetY);
        currentPath = currentPath ?? [];
        currentPath.push(segment(currentPoint, nextPoint));
        currentPoint = nextPoint;
      } else if (cmdType === "C" || cmdType === "CURVETO") {
        const x1 = getCommandValue(cmd, 0, "x1");
        const y1 = getCommandValue(cmd, 1, "y1");
        const x2 = getCommandValue(cmd, 2, "x2");
        const y2 = getCommandValue(cmd, 3, "y2");
        const x = getCommandValue(cmd, 4, "x");
        const y = getCommandValue(cmd, 5, "y");
        if (
          x1 === undefined ||
          y1 === undefined ||
          x2 === undefined ||
          y2 === undefined ||
          x === undefined ||
          y === undefined
        ) {
          continue;
        }
        const control1 = toPoint(x1, y1, scale, offsetX, offsetY);
        const control2 = toPoint(x2, y2, scale, offsetX, offsetY);
        const end = toPoint(x, y, scale, offsetX, offsetY);
        currentPath = currentPath ?? [];
        currentPath.push(curve(currentPoint, control1, control2, end));
        currentPoint = end;
      } else if (cmdType === "Q" || cmdType === "QUADTO") {
        const x1 = getCommandValue(cmd, 0, "x1");
        const y1 = getCommandValue(cmd, 1, "y1");
        const x = getCommandValue(cmd, 2, "x");
        const y = getCommandValue(cmd, 3, "y");
        if (
          x1 === undefined ||
          y1 === undefined ||
          x === undefined ||
          y === undefined
        ) {
          continue;
        }
        const control = toPoint(x1, y1, scale, offsetX, offsetY);
        const end = toPoint(x, y, scale, offsetX, offsetY);
        const { c1, c2 } = quadraticToCubic(currentPoint, control, end);
        currentPath = currentPath ?? [];
        currentPath.push(curve(currentPoint, c1, c2, end));
        currentPoint = end;
      } else if (cmdType === "Z" || cmdType === "CLOSEPATH") {
        if (subpathStart && currentPoint) {
          currentPath = currentPath ?? [];
          currentPath.push(segment(currentPoint, subpathStart));
          currentPoint = subpathStart;
        }
      }
    }

    if (currentPath && currentPath.length > 0) {
      paths.push(currentPath);
    }

    cursorX += pos.xAdvance ?? glyph?.advanceWidth ?? 0;
    cursorY += pos.yAdvance ?? 0;
  }

  return paths;
};

const flipPathY = (path: Path): Path =>
  path.map((seg) => {
    if (seg.type === "line") {
      return {
        type: "line",
        points: [
          [seg.points[0][0], -seg.points[0][1]],
          [seg.points[1][0], -seg.points[1][1]],
        ],
      };
    }
    return {
      type: "bezier",
      start: [seg.start[0], -seg.start[1]],
      control1: [seg.control1[0], -seg.control1[1]],
      control2: [seg.control2[0], -seg.control2[1]],
      end: [seg.end[0], -seg.end[1]],
    };
  });

const pathsToSVG = (paths: Path[]): string =>
  paths.map((path) => pathToSVGPath(path)).join(" ");

export const text = ({
  key,
  name,
  text: textContent,
  fill = "black",
  stroke,
  strokeWidth = 0,
  filter,
  fontSize = 12,
  fontFamily = "system-ui, sans-serif",
  font,
  fontData,
  textAnchor = "middle",
  dominantBaseline = "central",
  debugBoundingBox = false,
  ...fancyDims
}: {
  key?: string;
  name?: string;
  text: MaybeValue<string>;
  fill?: MaybeValue<string>;
  stroke?: MaybeValue<string>;
  strokeWidth?: number;
  filter?: string;
  fontSize?: number;
  fontFamily?: string;
  font?: any;
  fontData?: ArrayBuffer | Uint8Array;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?: "auto" | "central" | "hanging" | "mathematical";
  debugBoundingBox?: boolean;
} & FancyDims<MaybeValue<number>>) => {
  const dims = elaborateDims(fancyDims).map(inferEmbedded);

  let resolvedFont: any | undefined = font;
  if (!resolvedFont && fontData) {
    try {
      const buffer =
        fontData instanceof Uint8Array ? fontData : new Uint8Array(fontData);
      resolvedFont = fontkit.create(buffer);
    } catch {
      resolvedFont = undefined;
    }
  }
  if (!resolvedFont && fontFamily) {
    resolvedFont = undefined;
  }

  return new GoFishNode(
    {
      name,
      key,
      type: "text",
      args: {
        key,
        name,
        text: textContent,
        fill,
        stroke,
        strokeWidth,
        filter,
        fontSize,
        fontFamily,
        textAnchor,
        dominantBaseline,
        debugBoundingBox,
        dims,
      },
      color: fill,
      resolveUnderlyingSpace: () => {
        const xPos = dims[0].center ?? dims[0].min;
        const yPos = dims[1].center ?? dims[1].min;
        let underlyingSpaceX = UNDEFINED;
        if (!isValue(xPos)) {
          underlyingSpaceX = ORDINAL([]);
        } else {
          const min = getValue(xPos) ?? 0;
          const domain = interval(min, min);
          underlyingSpaceX = POSITION(domain);
        }

        let underlyingSpaceY = UNDEFINED;
        if (!isValue(yPos)) {
          underlyingSpaceY = ORDINAL([]);
        } else {
          const min = getValue(yPos) ?? 0;
          const domain = interval(min, min);
          underlyingSpaceY = POSITION(domain);
        }

        if (isAesthetic(xPos) && isValue(dims[0].size)) {
          underlyingSpaceX = DIFFERENCE(getValue(dims[0].size)!);
        } else if (!isValue(xPos) && isValue(dims[0].size)) {
          underlyingSpaceX = SIZE(getValue(dims[0].size)!);
        }

        if (isAesthetic(yPos) && isValue(dims[1].size)) {
          underlyingSpaceY = DIFFERENCE(getValue(dims[1].size)!);
        } else if (!isValue(yPos) && isValue(dims[1].size)) {
          underlyingSpaceY = SIZE(getValue(dims[1].size)!);
        }

        return [underlyingSpaceX, underlyingSpaceY];
      },
      inferSizeDomains: () => {
        const finalText = isValue(textContent)
          ? getValue(textContent)
          : textContent;
        const layout = resolveFontLayout(
          resolvedFont,
          finalText ?? "",
          fontSize,
          fontFamily,
          textAnchor,
          dominantBaseline
        );
        const width = layout.bbox.maxX - layout.bbox.minX;
        const height = layout.bbox.maxY - layout.bbox.minY;

        return {
          w: Monotonic.linear(width, 0),
          h: Monotonic.linear(height, 0),
        };
      },
      layout: (
        shared,
        size,
        scaleFactors,
        children,
        measurement,
        posScales
      ) => {
        const finalText = isValue(textContent)
          ? getValue(textContent)
          : textContent;
        const layout = resolveFontLayout(
          resolvedFont,
          finalText ?? "",
          fontSize,
          fontFamily,
          textAnchor,
          dominantBaseline
        );

        const anchorX = layout.anchorEm.x * layout.scale;
        const anchorY = layout.anchorEm.y * layout.scale;
        const minX = layout.bbox.minX - anchorX;
        const maxX = layout.bbox.maxX - anchorX;
        const minY = layout.bbox.minY - anchorY;
        const maxY = layout.bbox.maxY - anchorY;

        const positionX =
          computeAesthetic(dims[0].center, posScales?.[0]!, undefined) ??
          computeAesthetic(dims[0].min, posScales?.[0]!, undefined);
        const positionY =
          computeAesthetic(dims[1].center, posScales?.[1]!, undefined) ??
          computeAesthetic(dims[1].min, posScales?.[1]!, undefined);

        return {
          intrinsicDims: [
            {
              min: minX,
              size: maxX - minX,
              center: (minX + maxX) / 2,
              max: maxX,
              embedded: dims[0].embedded,
            },
            {
              min: minY,
              size: maxY - minY,
              center: (minY + maxY) / 2,
              max: maxY,
              embedded: dims[1].embedded,
            },
          ],
          transform: {
            translate: [positionX, positionY],
          },
          renderData: { layout },
        };
      },
      render: ({
        intrinsicDims,
        transform,
        coordinateTransform,
        renderData,
      }: {
        intrinsicDims?: Dimensions;
        transform?: Transform;
        coordinateTransform?: CoordinateTransform;
        renderData?: { layout?: FontLayout };
      }) => {
        const space = coordinateTransform ?? linear();

        const finalText = isValue(textContent)
          ? getValue(textContent)
          : textContent;

        const anchorX = transform?.translate?.[0] ?? 0;
        const anchorY = transform?.translate?.[1] ?? 0;

        const unit = scaleContext?.unit;
        const unitColorScale = unit && "color" in unit ? unit.color : undefined;
        const resolvedFill = isValue(fill)
          ? unitColorScale
            ? unitColorScale.get(getValue(fill))
            : getValue(fill)
          : (fill as string | undefined);
        const resolvedStroke = isValue(stroke)
          ? unitColorScale
            ? unitColorScale.get(getValue(stroke))
            : getValue(stroke)
          : (stroke as string | undefined);

        const layout =
          renderData?.layout ??
          resolveFontLayout(
            resolvedFont,
            finalText ?? "",
            fontSize,
            fontFamily,
            textAnchor,
            dominantBaseline
          );

        const bboxStroke = "#ff00aa";
        const bboxStrokeWidth = 1;
        const bboxDash = "4 3";
        const showDebugBoundingBox = debugBoundingBox;

        const anchorXLocal = layout.anchorEm.x * layout.scale;
        const anchorYLocal = layout.anchorEm.y * layout.scale;
        const minXRel = layout.bbox.minX - anchorXLocal;
        const maxXRel = layout.bbox.maxX - anchorXLocal;
        const minYRel = layout.bbox.minY - anchorYLocal;
        const maxYRel = layout.bbox.maxY - anchorYLocal;

        if (space.type !== "linear" && layout.font) {
          const paths = buildTextPaths(layout, [anchorX, anchorY]);
          if (paths.length === 0) return null;

          const transformed = paths.map((p) =>
            transformPath(p, space, { resample: true })
          );
          const flipped = transformed.map(flipPathY);

          const bbox =
            showDebugBoundingBox &&
            Number.isFinite(minXRel) &&
            Number.isFinite(minYRel)
              ? (() => {
                  const p = rectPath(
                    anchorX + minXRel,
                    anchorY + minYRel,
                    anchorX + maxXRel,
                    anchorY + maxYRel
                  );
                  const tp = transformPath(p, space, { resample: true });
                  const fp = flipPathY(tp);
                  return (
                    <path
                      transform="scale(1, -1)"
                      d={pathToSVGPath(fp)}
                      fill="none"
                      stroke={bboxStroke}
                      stroke-width={bboxStrokeWidth}
                      stroke-dasharray={bboxDash}
                      pointer-events="none"
                    />
                  );
                })()
              : null;

          return (
            <>
              {bbox}
              <path
                transform="scale(1, -1)"
                d={pathsToSVG(flipped)}
                fill={resolvedFill}
                stroke={resolvedStroke}
                stroke-width={strokeWidth ?? 0}
                filter={filter}
              />
            </>
          );
        }

        const [transformedX, transformedY] = space.transform([
          anchorX,
          anchorY,
        ]);

        const effectiveFontFamily = getEffectiveFontFamily({
          fontSize,
          fontFamily,
          resolvedFont,
        });

        const bbox =
          showDebugBoundingBox &&
          Number.isFinite(minXRel) &&
          Number.isFinite(minYRel) ? (
            <rect
              transform="scale(1, -1)"
              x={transformedX + minXRel}
              y={-(transformedY + maxYRel)}
              width={maxXRel - minXRel}
              height={maxYRel - minYRel}
              fill="none"
              stroke={bboxStroke}
              stroke-width={bboxStrokeWidth}
              stroke-dasharray={bboxDash}
              pointer-events="none"
            />
          ) : null;

        return (
          <>
            {bbox}
            <text
              transform="scale(1, -1)"
              x={transformedX}
              y={-transformedY}
              fill={resolvedFill}
              stroke={resolvedStroke}
              stroke-width={strokeWidth ?? 0}
              filter={filter}
              font-size={`${fontSize}px`}
              font-family={effectiveFontFamily}
              text-anchor={textAnchor}
              dominant-baseline={dominantBaseline}
            >
              {finalText}
            </text>
          </>
        );
      },
    },
    []
  );
};
