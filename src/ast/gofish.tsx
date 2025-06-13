import { For, Show, type JSX } from "solid-js";
import { render as solidRender } from "solid-js/web";
import { debugNodeTree, type GoFishNode } from "./_node";
import { ScopeContext } from "./scopeContext";
import { computePosScale } from "./domain";
import { tickIncrement } from "d3-array";

/* scope context */
let scopeContext: ScopeContext | null = null;

export const getScopeContext = (): ScopeContext => {
  if (!scopeContext) {
    throw new Error("Scope context not set");
  }
  return scopeContext;
};

type ScaleContext = { [measure: string]: { color: Map<any, string> } };

/* scale context */
export let scaleContext: ScaleContext | null = null;

export const getScaleContext = (): ScaleContext => {
  if (!scaleContext) {
    throw new Error("Scale context not set");
  }
  return scaleContext;
};

/* d3 nice linear scale re-implementation*/
const nice = (domain: [number, number], tickCount: number = 10) => {
  let startIndex = 0;
  let endIndex = domain.length - 1;
  let domainStart = domain[startIndex];
  let domainEnd = domain[endIndex];

  let previousStepSize;
  let currentStepSize;
  const maxIterations = 10;

  // Handle reversed domains by swapping values and indices
  if (domainEnd < domainStart) {
    [domainStart, domainEnd] = [domainEnd, domainStart];
    [startIndex, endIndex] = [endIndex, startIndex];
  }

  // Iteratively refine domain boundaries to "nice" round numbers
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    currentStepSize = tickIncrement(domainStart, domainEnd, tickCount);

    // If step size hasn't changed, we've converged to optimal boundaries
    if (currentStepSize === previousStepSize) {
      domain[startIndex] = domainStart;
      domain[endIndex] = domainEnd;
      return domain;
    }

    if (currentStepSize > 0) {
      // Expand domain outward to nice round multiples
      domainStart = Math.floor(domainStart / currentStepSize) * currentStepSize;
      domainEnd = Math.ceil(domainEnd / currentStepSize) * currentStepSize;
    } else if (currentStepSize < 0) {
      // Contract domain inward (for negative step sizes)
      domainStart = Math.ceil(domainStart * currentStepSize) / currentStepSize;
      domainEnd = Math.floor(domainEnd * currentStepSize) / currentStepSize;
    } else {
      // Step size is zero, cannot make further improvements
      break;
    }

    previousStepSize = currentStepSize;
  }

  return domain;
};

/* global pass handler */
export const gofish = (
  container: HTMLElement,
  {
    width,
    height,
    transform,
    debug = false,
    defs,
    axes = false,
  }: {
    width: number;
    height: number;
    transform?: { x?: number; y?: number };
    debug?: boolean;
    defs?: JSX.Element[];
    axes?: boolean;
  },
  child: GoFishNode
) => {
  scopeContext = new Map();
  scaleContext = { unit: { color: new Map() } };
  try {
    // const domainAST = child.inferDomain();
    // const sizeThatFitsAST = domainAST.sizeThatFits();
    // const layoutAST = sizeThatFitsAST.layout();
    // return render({ width, height, transform }, layoutAST);
    child.resolveColorScale();
    child.resolveNames();
    const [posDomainX, posDomainY] = child.inferPosDomains();
    child.inferSizeDomains([width, height])([undefined, undefined]);
    child.layout(
      [width, height],
      [undefined, undefined],
      [
        posDomainX ? computePosScale(posDomainX, width) : undefined,
        posDomainY ? computePosScale(posDomainY, height, true) : undefined,
      ]
    );
    child.place({ x: transform?.x ?? 0, y: transform?.y ?? 0 });
    if (debug) {
      debugNodeTree(child);
    }

    // Render to the provided container
    console.log(scaleContext);
    solidRender(() => render({ width, height, defs, axes, scaleContext }, child), container);
    return container;
  } finally {
    scopeContext = null;
    scaleContext = null;
  }
};

const PADDING = 10;

export const render = (
  {
    width,
    height,
    transform,
    defs,
    axes,
    scaleContext,
  }: {
    width: number;
    height: number;
    transform?: string;
    defs?: JSX.Element[];
    axes?: boolean;
    scaleContext: ScaleContext;
  },
  child: GoFishNode
): JSX.Element => {
  let yTicks: number[] = [];
  if (axes) {
    const [min, max] = nice(scaleContext.y.domain);
    yTicks = Array.from({ length: 11 }, (_, i) => min + (max - min) * (i / 10));
  }

  return (
    <svg width={width + PADDING * 6} height={height + PADDING * 6}>
      <Show when={defs}>
        <defs>{defs}</defs>
      </Show>
      <g transform={`translate(${PADDING * 4}, ${PADDING * 4})`}>
        <Show when={transform} keyed fallback={child.INTERNAL_render()}>
          <g transform={transform ?? ""}>{child.INTERNAL_render()}</g>
        </Show>
        <Show when={axes}>
          <g>
            {/* x axis */}
            {/* <line
              x1={0}
              y1={height + PADDING}
              x2={width + PADDING}
              y2={height + PADDING}
              stroke="gray"
              stroke-width="1px"
            /> */}
            {/* y axis */}
            <line x1={-PADDING} y1={0} x2={-PADDING} y2={height} stroke="gray" stroke-width="1px" />
            <For each={yTicks}>
              {(tick) => (
                <text
                  x={-PADDING * 1.5}
                  y={height - tick * scaleContext.y.scaleFactor}
                  text-anchor="end"
                  dominant-baseline="middle"
                  font-size="10px"
                  fill="gray"
                >
                  {tick}
                </text>
              )}
            </For>
          </g>
        </Show>
      </g>
    </svg>
  );
};
