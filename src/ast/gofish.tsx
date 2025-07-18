import { For, Show, type JSX } from "solid-js";
import { render as solidRender } from "solid-js/web";
import { debugNodeTree, findPathToRoot, type GoFishNode } from "./_node";
import { ScopeContext } from "./scopeContext";
import { computePosScale } from "./domain";
import { tickIncrement, ticks, nice } from "d3-array";

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

type KeyContext = { [key: string]: GoFishNode };

export let keyContext: KeyContext | null = null;

export const getKeyContext = (): KeyContext => {
  if (!keyContext) {
    throw new Error("Key context not set");
  }
  return keyContext;
};

/* global pass handler */
export const gofish = (
  container: HTMLElement,
  {
    w,
    h,
    x,
    y,
    transform,
    debug = false,
    defs,
    axes = false,
  }: {
    w: number;
    h: number;
    x?: number;
    y?: number;
    transform?: { x?: number; y?: number };
    debug?: boolean;
    defs?: JSX.Element[];
    axes?: boolean;
  },
  child: GoFishNode
) => {
  scopeContext = new Map();
  scaleContext = { unit: { color: new Map() } };
  keyContext = {};
  try {
    // const domainAST = child.inferDomain();
    // const sizeThatFitsAST = domainAST.sizeThatFits();
    // const layoutAST = sizeThatFitsAST.layout();
    // return render({ width, height, transform }, layoutAST);
    child.resolveColorScale();
    child.resolveNames();
    child.resolveKeys();
    const [posDomainX, posDomainY] = child.inferPosDomains();
    child.inferSizeDomains([w, h])([undefined, undefined]);
    child.layout(
      [w, h],
      [undefined, undefined],
      [
        posDomainX ? computePosScale(posDomainX, w) : undefined,
        posDomainY ? computePosScale(posDomainY, h, true) : undefined,
      ]
    );
    child.place({ x: x ?? transform?.x ?? 0, y: y ?? transform?.y ?? 0 });
    if (debug) {
      debugNodeTree(child);
    }

    // Render to the provided container
    // console.log(scaleContext);
    solidRender(() => render({ width: w, height: h, defs, axes, scaleContext, keyContext }, child), container);
    return container;
  } finally {
    if (debug) {
      console.log("scopeContext", scopeContext);
      // console.log("scaleContext", scaleContext);
      // console.log("keyContext", keyContext);
    }
    scopeContext = null;
    scaleContext = null;
    keyContext = null;
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
    keyContext,
  }: {
    width: number;
    height: number;
    transform?: string;
    defs?: JSX.Element[];
    axes?: boolean;
    scaleContext: ScaleContext;
    keyContext: KeyContext;
  },
  child: GoFishNode
): JSX.Element => {
  let yTicks: number[] = [];
  if (axes) {
    // console.log(scaleContext);
    // console.log(keyContext);
    const [min, max] = nice(scaleContext.y.domain[0], scaleContext.y.domain[1], 10);
    yTicks = ticks(min, max, 10);
  }

  return (
    <svg width={width + PADDING * 6 + (axes ? 100 : 0)} height={height + PADDING * 6}>
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
            {/* y axis (continuous for now) */}
            <g>
              <line
                x1={-PADDING}
                y1={height - yTicks[yTicks.length - 1] * scaleContext.y.scaleFactor - 0.5}
                x2={-PADDING}
                y2={height - yTicks[0] * scaleContext.y.scaleFactor + 0.5}
                stroke="gray"
                stroke-width="1px"
              />
              <For each={yTicks}>
                {(tick) => (
                  <>
                    <text
                      x={-PADDING * 1.75}
                      y={height - tick * scaleContext.y.scaleFactor}
                      text-anchor="end"
                      dominant-baseline="middle"
                      font-size="10px"
                      fill="gray"
                    >
                      {tick}
                    </text>
                    <line
                      x1={-PADDING * 1.5}
                      y1={height - tick * scaleContext.y.scaleFactor}
                      x2={-PADDING}
                      y2={height - tick * scaleContext.y.scaleFactor}
                      stroke="gray"
                    />
                  </>
                )}
              </For>
            </g>
            {/* x axis (discrete for now) */}
            <g>
              <For each={Object.entries(keyContext)}>
                {([key, value]) => {
                  const pathToRoot = findPathToRoot(value);
                  const accumulatedTransform = pathToRoot.reduce(
                    (acc, node) => {
                      return {
                        x: acc.x + (node.transform?.translate?.[0] ?? 0),
                        y: acc.y + (node.transform?.translate?.[1] ?? 0),
                      };
                    },
                    { x: 0, y: 0 }
                  );
                  const displayDims = [
                    {
                      min: (accumulatedTransform.x ?? 0) + (value.intrinsicDims?.[0]?.min ?? 0),
                      size: value.intrinsicDims?.[0]?.size ?? 0,
                      center: (accumulatedTransform.x ?? 0) + (value.intrinsicDims?.[0]?.center ?? 0),
                      max: (accumulatedTransform.x ?? 0) + (value.intrinsicDims?.[0]?.max ?? 0),
                    },
                    {
                      min: (accumulatedTransform.y ?? 0) + (value.intrinsicDims?.[1]?.min ?? 0),
                      size: value.intrinsicDims?.[1]?.size ?? 0,
                      center: (accumulatedTransform.y ?? 0) + (value.intrinsicDims?.[1]?.center ?? 0),
                      max: (accumulatedTransform.y ?? 0) + (value.intrinsicDims?.[1]?.max ?? 0),
                    },
                  ];
                  return (
                    <text
                      x={displayDims[0].center ?? 0}
                      y={(displayDims[1].max ?? 0) + 5}
                      text-anchor="middle"
                      dominant-baseline="hanging"
                      font-size="10px"
                      fill="gray"
                    >
                      {key}
                    </text>
                  );
                }}
              </For>
            </g>
            {/* legend (discrete color for now) */}
            <g>
              <For each={Array.from(scaleContext.unit.color.entries())}>
                {([key, value], i) => (
                  <g transform={`translate(${width + PADDING * 3}, ${i() * 20})`}>
                    <rect x={-20} y={-5} width={10} height={10} fill={value} />
                    <text x={-5} y={0} text-anchor="start" dominant-baseline="middle" font-size="10px" fill="gray">
                      {key}
                    </text>
                  </g>
                )}
              </For>
            </g>
          </g>
        </Show>
      </g>
    </svg>
  );
};
