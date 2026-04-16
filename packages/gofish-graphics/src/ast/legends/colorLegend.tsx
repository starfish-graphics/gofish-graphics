import { For, type JSX } from "solid-js";
import { ticks } from "d3-array";
import type { ColorScaleInfo } from "../gofish";

const SWATCH_SIZE = 10;
const SWATCH_SPACING = 20;
const FONT_SIZE = "10px";

/**
 * Renders a discrete color legend with rect swatches and text labels.
 * Position is the top-right corner of the legend group.
 */
export function renderDiscreteColorLegend(
  colorInfo: Extract<ColorScaleInfo, { type: "discrete" }>,
  position: { x: number; y: number }
): JSX.Element {
  const entries = Array.from(colorInfo.color.entries());
  return (
    <g>
      <For each={entries}>
        {([key, value], i) => (
          <g
            transform={`translate(${position.x}, ${position.y - i() * SWATCH_SPACING})`}
          >
            <rect
              x={-SWATCH_SIZE - 10}
              y={-SWATCH_SIZE / 2}
              width={SWATCH_SIZE}
              height={SWATCH_SIZE}
              fill={value}
            />
            <text
              transform="scale(1, -1)"
              x={-SWATCH_SIZE / 2 + 3}
              y={0}
              text-anchor="start"
              dominant-baseline="middle"
              font-size={FONT_SIZE}
              fill="gray"
            >
              {String(key)}
            </text>
          </g>
        )}
      </For>
    </g>
  );
}

const GRADIENT_BAR_WIDTH = 14;
const GRADIENT_BAR_HEIGHT = 120;
const TICK_COUNT = 5;

/**
 * Renders a continuous color legend as a vertical gradient bar with tick labels.
 * Position is the top-right corner of the legend group.
 */
export function renderContinuousColorLegend(
  colorInfo: Extract<ColorScaleInfo, { type: "continuous" }>,
  position: { x: number; y: number }
): JSX.Element {
  const { scaleFn, domain } = colorInfo;
  const [domainMin, domainMax] = domain;

  // Sample the gradient at evenly spaced stops
  const STOP_COUNT = 20;
  const stops = Array.from({ length: STOP_COUNT + 1 }, (_, i) => {
    const t = i / STOP_COUNT;
    const value = domainMin + t * (domainMax - domainMin);
    return { offset: `${(t * 100).toFixed(1)}%`, color: scaleFn(value) };
  });

  const gradientId = `colorLegendGradient-${Math.random().toString(36).slice(2, 8)}`;

  // Compute tick positions in the bar's coordinate space (bar goes bottom to top)
  const tickValues = ticks(domainMin, domainMax, TICK_COUNT);

  const barX = position.x;
  const barTopY = position.y;
  const barBottomY = position.y - GRADIENT_BAR_HEIGHT;

  const valueToBarY = (v: number): number => {
    const t =
      domainMax === domainMin ? 0 : (v - domainMin) / (domainMax - domainMin);
    return barTopY - t * GRADIENT_BAR_HEIGHT;
  };

  return (
    <>
      <defs>
        {/* Gradient runs from bottom (domainMin) to top (domainMax) in screen-space.
            Since the chart SVG is flipped with scale(1,-1), "top" in screen means
            y=0 end of the gradient, which corresponds to domainMax. */}
        <linearGradient
          id={gradientId}
          x1="0"
          y1="1"
          x2="0"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <For each={stops}>
            {(stop) => <stop offset={stop.offset} stop-color={stop.color} />}
          </For>
        </linearGradient>
      </defs>
      <g>
        {/* Gradient bar */}
        <rect
          x={barX - GRADIENT_BAR_WIDTH - 10}
          y={barBottomY}
          width={GRADIENT_BAR_WIDTH}
          height={GRADIENT_BAR_HEIGHT}
          fill={`url(#${gradientId})`}
        />
        {/* Tick marks and labels */}
        <For each={tickValues}>
          {(tickVal) => {
            const tickY = valueToBarY(tickVal);
            return (
              <g transform={`translate(${barX - 10}, ${tickY})`}>
                <line
                  x1={-GRADIENT_BAR_WIDTH}
                  y1={0}
                  x2={-GRADIENT_BAR_WIDTH - 4}
                  y2={0}
                  stroke="gray"
                  stroke-width="1"
                />
                <text
                  transform="scale(1, -1)"
                  x={-GRADIENT_BAR_WIDTH - 8}
                  y={0}
                  text-anchor="end"
                  dominant-baseline="middle"
                  font-size={FONT_SIZE}
                  fill="gray"
                >
                  {tickVal % 1 === 0 ? String(tickVal) : tickVal.toFixed(2)}
                </text>
              </g>
            );
          }}
        </For>
      </g>
    </>
  );
}
