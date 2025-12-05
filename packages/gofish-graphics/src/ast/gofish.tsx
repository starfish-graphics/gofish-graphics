import { createResource, For, Show, Suspense, type JSX } from "solid-js";
import { render as solidRender } from "solid-js/web";
import {
  debugInputSceneGraph,
  debugNodeTree,
  debugUnderlyingSpaceTree,
  findPathToRoot,
  type GoFishNode,
} from "./_node";
import { ScopeContext } from "./scopeContext";
import { computePosScale } from "./domain";
import { tickIncrement, ticks, nice } from "d3-array";
import { isConstant } from "../util/monotonic";
import {
  isINTERVAL,
  isPOSITION,
  type UnderlyingSpace,
} from "./underlyingSpace";
import { continuous } from "./domain";
import {
  initLayerContext,
  resetLayerContext,
} from "./graphicalOperators/frame";

/* scope context */
let scopeContext: ScopeContext | null = null;

export const getScopeContext = (): ScopeContext => {
  if (!scopeContext) {
    throw new Error("Scope context not set");
  }
  return scopeContext;
};

type ScaleContext = {
  [measure: string]:
    | { color: Map<any, string> }
    | { domain: [number, number]; scaleFactor: number };
};

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

export async function layout(
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
  child: GoFishNode | Promise<GoFishNode>
): Promise<{
  sizeDomains: [any, any];
  underlyingSpaceX: UnderlyingSpace;
  underlyingSpaceY: UnderlyingSpace;
  posScales: [(pos: number) => number, (pos: number) => number];
  child: GoFishNode;
}> {
  child = await child;
  if (debug) {
    console.log("🌳 Input Scene Graph:");
    debugInputSceneGraph(child);
  }

  // const domainAST = child.inferDomain();
  // const sizeThatFitsAST = domainAST.sizeThatFits();
  // const layoutAST = sizeThatFitsAST.layout();
  // return render({ width, height, transform }, layoutAST);
  child.resolveColorScale();
  child.resolveNames();
  child.resolveKeys();
  const [posDomainX, posDomainY] = child.inferPosDomains();
  const sizeDomains = child.inferSizeDomains();
  const [underlyingSpaceX, underlyingSpaceY] = child.resolveUnderlyingSpace();

  if (debug) {
    console.log("🌳 Underlying Space Tree:");
    debugUnderlyingSpaceTree(child);
  }

  const posScales = [
    underlyingSpaceX.kind === "position"
      ? computePosScale(
          continuous({
            value: [underlyingSpaceX.domain!.min, underlyingSpaceX.domain!.max],
            measure: "unit",
          }),
          w
        )
      : posDomainX
        ? computePosScale(posDomainX, w)
        : undefined,
    underlyingSpaceY.kind === "position"
      ? computePosScale(
          continuous({
            value: [underlyingSpaceY.domain!.min, underlyingSpaceY.domain!.max],
            measure: "unit",
          }),
          h
        )
      : posDomainY
        ? computePosScale(posDomainY, h)
        : undefined,
  ];

  if (debug) {
    console.log("width and height constraints:", w, h);
  }

  child.layout([w, h], [undefined, undefined], posScales);
  child.place({ x: x ?? transform?.x ?? 0, y: y ?? transform?.y ?? 0 });

  if (debug) {
    console.log("🌳 Node Tree:");
    debugNodeTree(child);
  }

  return {
    sizeDomains,
    underlyingSpaceX,
    underlyingSpaceY,
    posScales,
    child,
  };
}

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
  child: GoFishNode | Promise<GoFishNode>
) => {
  type LayoutData = {
    sizeDomains: [any, any];
    underlyingSpaceX: UnderlyingSpace;
    underlyingSpaceY: UnderlyingSpace;
    posScales: [(pos: number) => number, (pos: number) => number];
    child: GoFishNode;
    scaleContext: ScaleContext;
    keyContext: KeyContext;
  };

  const runGofish = async (): Promise<LayoutData> => {
    try {
      scopeContext = new Map();
      scaleContext = { unit: { color: new Map() } };
      keyContext = {};
      initLayerContext();

      const layoutResult = await layout(
        { w, h, x, y, transform, debug, defs, axes },
        child
      );

      const result = {
        ...layoutResult,
        scaleContext: scaleContext!,
        keyContext: keyContext!,
      };

      return result;
    } finally {
      if (debug) {
        console.log("scaleContext", scaleContext);
        console.log("scopeContext", scopeContext);
        // console.log("keyContext", keyContext);
      }
      scopeContext = null;
      scaleContext = null;
      keyContext = null;
      resetLayerContext();
    }
  };

  const [layoutData] = createResource(runGofish);

  // Render to the provided container
  solidRender(() => {
    // used to handle async rendering of derived data
    return (
      <Suspense fallback={<div>Loading...</div>}>
        {(() => {
          const data = layoutData();
          if (!data) return null;
          return render(
            {
              width: w,
              height: h,
              defs,
              axes,
              scaleContext: data.scaleContext,
              keyContext: data.keyContext,
              sizeDomains: data.sizeDomains,
              underlyingSpaceX: data.underlyingSpaceX,
              underlyingSpaceY: data.underlyingSpaceY,
              posScales: data.posScales,
            },
            data.child
          );
        })()}
      </Suspense>
    );
  }, container);
  return container;
};

const PADDING = 10;

export const render = (
  {
    width,
    height,
    transform,
    defs,
    axes,
    scaleContext: scaleContextParam,
    keyContext: keyContextParam,
    sizeDomains,
    underlyingSpaceX,
    underlyingSpaceY,
    posScales,
  }: {
    width: number;
    height: number;
    transform?: string;
    defs?: JSX.Element[];
    axes?: boolean;
    scaleContext: ScaleContext | null;
    keyContext: KeyContext | null;
    sizeDomains?: [any, any];
    underlyingSpaceX: UnderlyingSpace;
    underlyingSpaceY: UnderlyingSpace;
    posScales: [(pos: number) => number, (pos: number) => number];
  },
  child: GoFishNode
): JSX.Element => {
  // Restore global contexts for rendering (components access these via getScaleContext/getKeyContext)
  // Note: scaleContext is always null here because runGofish() cleans it up in the finally block
  scaleContext = scaleContextParam;
  keyContext = keyContextParam;

  let yTicks: number[] = [];
  let xTicks: number[] = [];
  if (
    axes &&
    scaleContext?.x &&
    scaleContext?.y &&
    "domain" in scaleContext.x &&
    "scaleFactor" in scaleContext.x &&
    "domain" in scaleContext.y &&
    "scaleFactor" in scaleContext.y
  ) {
    const [xMin, xMax] = nice(
      scaleContext.x.domain[0],
      scaleContext.x.domain[1],
      10
    );
    xTicks = ticks(xMin, xMax, 10);

    const [yMin, yMax] = nice(
      scaleContext.y.domain[0],
      scaleContext.y.domain[1],
      10
    );
    yTicks = ticks(yMin, yMax, 10);
  }

  const result = (
    <svg
      width={width + PADDING * 6 + (axes ? 100 : 0)}
      height={height + PADDING * 6 + (axes ? 100 : 0)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Show when={defs}>
        <defs>{defs}</defs>
      </Show>
      <g
        transform={`scale(1, -1) translate(${PADDING * 4}, ${-height - PADDING * 4})`}
      >
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
            {/* y axis (continuous) */}
            <Show when={isPOSITION(underlyingSpaceY)}>
              {(() => {
                const [yMin, yMax] = nice(
                  underlyingSpaceY.domain!.min,
                  underlyingSpaceY.domain!.max,
                  10
                );
                const yTicks = ticks(yMin, yMax, 10);
                return (
                  <g>
                    <line
                      x1={-PADDING}
                      y1={posScales[1](yTicks[0]) - 0.5}
                      x2={-PADDING}
                      y2={posScales[1](yTicks[yTicks.length - 1]) + 0.5}
                      stroke="gray"
                      stroke-width="1px"
                    />
                    <For each={yTicks}>
                      {(tick) => (
                        <>
                          <text
                            transform="scale(1, -1)"
                            x={-PADDING * 1.75}
                            y={-posScales[1](tick)}
                            text-anchor="end"
                            dominant-baseline="middle"
                            font-size="10px"
                            fill="gray"
                          >
                            {tick}
                          </text>
                          <line
                            x1={-PADDING * 1.5}
                            y1={posScales[1](tick)}
                            x2={-PADDING}
                            y2={posScales[1](tick)}
                            stroke="gray"
                          />
                        </>
                      )}
                    </For>
                  </g>
                );
              })()}
            </Show>
            <Show
              when={
                isINTERVAL(underlyingSpaceY) &&
                scaleContext?.y &&
                "scaleFactor" in scaleContext.y
              }
            >
              {(() => {
                const yScale = scaleContext!.y as {
                  domain: [number, number];
                  scaleFactor: number;
                };
                const [yMin, yMax] = nice(0, underlyingSpaceY.width, 10);
                const yTicks = ticks(yMin, yMax, 10);
                return (
                  <g>
                    <line
                      x1={-PADDING}
                      y1={(yTicks[0] - yTicks[0]) * yScale.scaleFactor - 0.5}
                      x2={-PADDING}
                      y2={
                        (yTicks[yTicks.length - 1] - yTicks[0]) *
                          yScale.scaleFactor +
                        0.5
                      }
                      stroke="gray"
                      stroke-width="1px"
                    />
                    <For each={yTicks}>
                      {(tick) => (
                        <>
                          <line
                            x1={-PADDING * 1.5}
                            y1={(tick - yTicks[0]) * yScale.scaleFactor}
                            x2={-PADDING}
                            y2={(tick - yTicks[0]) * yScale.scaleFactor}
                            stroke="gray"
                          />
                        </>
                      )}
                    </For>

                    {/* For each pair of yTicks, put text in between showing the difference */}
                    <For
                      each={Array.from(
                        { length: yTicks.length - 1 },
                        (_, i) => i
                      )}
                    >
                      {(i) => {
                        const tick1 = yTicks[i];
                        const tick2 = yTicks[i + 1];
                        const diff = tick2 - tick1;
                        // Position text halfway between the two ticks
                        const y1 = (tick1 - yTicks[0]) * yScale.scaleFactor;
                        const y2 = (tick2 - yTicks[0]) * yScale.scaleFactor;
                        const yMid = (y1 + y2) / 2;
                        return (
                          <text
                            transform="scale(1, -1)"
                            x={-PADDING * 1.5}
                            y={-yMid}
                            text-anchor="end"
                            dominant-baseline="middle"
                            font-size="10px"
                            fill="gray"
                          >
                            {diff}
                          </text>
                        );
                      }}
                    </For>
                  </g>
                );
              })()}
            </Show>

            {/* x axis (position) */}
            <Show when={isPOSITION(underlyingSpaceX)}>
              {(() => {
                const [xMin, xMax] = nice(
                  underlyingSpaceX.domain!.min,
                  underlyingSpaceX.domain!.max,
                  10
                );
                const xTicks = ticks(xMin, xMax, 10);
                return (
                  <g>
                    <line
                      x1={posScales[0](xTicks[0]) - 0.5}
                      y1={-PADDING}
                      x2={posScales[0](xTicks[xTicks.length - 1]) + 0.5}
                      y2={-PADDING}
                      stroke="gray"
                      stroke-width="1px"
                    />
                    <For each={xTicks}>
                      {(tick) => (
                        <>
                          <text
                            transform="scale(1, -1)"
                            x={posScales[0](tick)}
                            y={PADDING * 1.75}
                            text-anchor="middle"
                            dominant-baseline="hanging"
                            font-size="10px"
                            fill="gray"
                          >
                            {tick}
                          </text>
                          <line
                            x1={posScales[0](tick)}
                            y1={-PADDING}
                            x2={posScales[0](tick)}
                            y2={-PADDING * 1.5}
                            stroke="gray"
                          />
                        </>
                      )}
                    </For>
                  </g>
                );
              })()}
            </Show>

            {/* x axis (interval) */}
            <Show
              when={
                isINTERVAL(underlyingSpaceX) &&
                scaleContext?.x &&
                "scaleFactor" in scaleContext.x
              }
            >
              {(() => {
                const xScale = scaleContext!.x as {
                  domain: [number, number];
                  scaleFactor: number;
                };
                const [xMin, xMax] = nice(0, underlyingSpaceX.width, 10);
                const xTicks = ticks(xMin, xMax, 10);
                return (
                  <g>
                    <line
                      x1={(xTicks[0] - xTicks[0]) * xScale.scaleFactor - 0.5}
                      y1={-PADDING}
                      x2={
                        (xTicks[xTicks.length - 1] - xTicks[0]) *
                          xScale.scaleFactor +
                        0.5
                      }
                      y2={-PADDING}
                      stroke="gray"
                      stroke-width="1px"
                    />
                    <For each={xTicks}>
                      {(tick) => (
                        <>
                          <line
                            x1={(tick - xTicks[0]) * xScale.scaleFactor}
                            y1={-PADDING * 1.5}
                            x2={(tick - xTicks[0]) * xScale.scaleFactor}
                            y2={-PADDING}
                            stroke="gray"
                          />
                        </>
                      )}
                    </For>

                    {/* For each pair of xTicks, put text in between showing the difference */}
                    <For
                      each={Array.from(
                        { length: xTicks.length - 1 },
                        (_, i) => i
                      )}
                    >
                      {(i) => {
                        const tick1 = xTicks[i];
                        const tick2 = xTicks[i + 1];
                        const diff = tick2 - tick1;
                        // Position text halfway between the two ticks
                        const x1 = (tick1 - xTicks[0]) * xScale.scaleFactor;
                        const x2 = (tick2 - xTicks[0]) * xScale.scaleFactor;
                        const xMid = (x1 + x2) / 2;
                        return (
                          <text
                            transform="scale(1, -1)"
                            x={xMid}
                            y={PADDING * 1.75}
                            text-anchor="middle"
                            dominant-baseline="hanging"
                            font-size="10px"
                            fill="gray"
                          >
                            {diff}
                          </text>
                        );
                      }}
                    </For>
                  </g>
                );
              })()}
            </Show>
            {/* x axis (discrete) */}
            <Show when={underlyingSpaceX.kind === "ordinal" && keyContext}>
              <g>
                <For each={Object.entries(keyContext ?? {})}>
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
                        min:
                          (accumulatedTransform.x ?? 0) +
                          (value.intrinsicDims?.[0]?.min ?? 0),
                        size: value.intrinsicDims?.[0]?.size ?? 0,
                        center:
                          (accumulatedTransform.x ?? 0) +
                          (value.intrinsicDims?.[0]?.center ?? 0),
                        max:
                          (accumulatedTransform.x ?? 0) +
                          (value.intrinsicDims?.[0]?.max ?? 0),
                      },
                      {
                        min:
                          (accumulatedTransform.y ?? 0) +
                          (value.intrinsicDims?.[1]?.min ?? 0),
                        size: value.intrinsicDims?.[1]?.size ?? 0,
                        center:
                          (accumulatedTransform.y ?? 0) +
                          (value.intrinsicDims?.[1]?.center ?? 0),
                        max:
                          (accumulatedTransform.y ?? 0) +
                          (value.intrinsicDims?.[1]?.max ?? 0),
                      },
                    ];
                    return (
                      <text
                        transform="scale(1, -1)"
                        x={displayDims[0].center ?? 0}
                        y={-(displayDims[1].min ?? 0) + 5}
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
            </Show>
            <Show when={underlyingSpaceY.kind === "ordinal" && keyContext}>
              {/* Vertical (Y axis) labels */}
              <g>
                <For each={Object.values(keyContext ?? {})}>
                  {(value, i) => {
                    // Only render for GoFishNode (not GoFishRef)
                    if (!("intrinsicDims" in value) || !("key" in value))
                      return null;
                    // Accumulate transforms up the tree for correct label placement
                    const accumulatedTransform = findPathToRoot(
                      value as GoFishNode
                    ).reduce(
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
                        min:
                          (accumulatedTransform.x ?? 0) +
                          ((value as GoFishNode).intrinsicDims?.[0]?.min ?? 0),
                        size:
                          (value as GoFishNode).intrinsicDims?.[0]?.size ?? 0,
                        center:
                          (accumulatedTransform.x ?? 0) +
                          ((value as GoFishNode).intrinsicDims?.[0]?.center ??
                            0),
                        max:
                          (accumulatedTransform.x ?? 0) +
                          ((value as GoFishNode).intrinsicDims?.[0]?.max ?? 0),
                      },
                      {
                        min:
                          (accumulatedTransform.y ?? 0) +
                          ((value as GoFishNode).intrinsicDims?.[1]?.min ?? 0),
                        size:
                          (value as GoFishNode).intrinsicDims?.[1]?.size ?? 0,
                        center:
                          (accumulatedTransform.y ?? 0) +
                          ((value as GoFishNode).intrinsicDims?.[1]?.center ??
                            0),
                        max:
                          (accumulatedTransform.y ?? 0) +
                          ((value as GoFishNode).intrinsicDims?.[1]?.max ?? 0),
                      },
                    ];
                    return (
                      <text
                        transform="scale(1, -1)"
                        x={displayDims[0].min - 5}
                        y={-(displayDims[1].center ?? 0)}
                        text-anchor="end"
                        dominant-baseline="middle"
                        font-size="10px"
                        fill="gray"
                      >
                        {(value as GoFishNode).key}
                      </text>
                    );
                  }}
                </For>
              </g>
            </Show>
            {/* legend (discrete color for now) */}
            <g>
              <For
                each={Array.from(
                  (scaleContext?.unit && "color" in scaleContext.unit
                    ? scaleContext.unit.color
                    : new Map()
                  ).entries()
                )}
              >
                {([key, value], i) => (
                  <g
                    transform={`translate(${width + PADDING * 3}, ${height - i() * 20})`}
                  >
                    <rect x={-20} y={-5} width={10} height={10} fill={value} />
                    <text
                      transform="scale(1, -1)"
                      x={-5}
                      y={0}
                      text-anchor="start"
                      dominant-baseline="middle"
                      font-size="10px"
                      fill="gray"
                    >
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

  // Clean up global contexts (they're already null from runGofish's finally block, but be explicit)
  scaleContext = null;
  keyContext = null;

  return result;
};
