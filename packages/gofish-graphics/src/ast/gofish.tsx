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
  isDIFFERENCE,
  isORDINAL,
  isPOSITION,
  type UnderlyingSpace,
} from "./underlyingSpace";
import { continuous } from "./domain";
import { interval } from "../util/interval";
import {
  initLayerContext,
  resetLayerContext,
} from "./graphicalOperators/frame";
import { path, pathToSVGPath, transformPath } from "../path";

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

type OrdinalScale = (key: string) => number | undefined;

function buildOrdinalScaleX(
  keyContext: KeyContext,
  root: GoFishNode
): OrdinalScale {
  const keyToPosition = new Map<string, number>();

  for (const [key, node] of Object.entries(keyContext)) {
    if (!("intrinsicDims" in node) || !node.intrinsicDims) continue;

    const pathToRoot = findPathToRoot(node);
    const accumulatedTransform = pathToRoot.reduce(
      (acc, n) => {
        return {
          x: acc.x + (n.transform?.translate?.[0] ?? 0),
          y: acc.y + (n.transform?.translate?.[1] ?? 0),
        };
      },
      { x: 0, y: 0 }
    );

    const centerX =
      accumulatedTransform.x + (node.intrinsicDims[0]?.center ?? 0);
    keyToPosition.set(key, centerX);
  }

  return (key: string) => keyToPosition.get(key);
}

function buildOrdinalScaleY(
  keyContext: KeyContext,
  root: GoFishNode
): OrdinalScale {
  const keyToPosition = new Map<string, number>();

  for (const [key, node] of Object.entries(keyContext)) {
    if (!("intrinsicDims" in node) || !node.intrinsicDims) continue;

    const pathToRoot = findPathToRoot(node);
    const accumulatedTransform = pathToRoot.reduce(
      (acc, n) => {
        return {
          x: acc.x + (n.transform?.translate?.[0] ?? 0),
          y: acc.y + (n.transform?.translate?.[1] ?? 0),
        };
      },
      { x: 0, y: 0 }
    );

    const centerY =
      accumulatedTransform.y + (node.intrinsicDims[1]?.center ?? 0);
    keyToPosition.set(key, centerY);
  }

  return (key: string) => keyToPosition.get(key);
}

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
  child: GoFishNode | Promise<GoFishNode>,
  contexts?: {
    scaleCtx: ScaleContext;
    scopeCtx: ScopeContext;
    keyCtx: KeyContext;
  }
): Promise<{
  sizeDomains: [any, any];
  underlyingSpaceX: UnderlyingSpace;
  underlyingSpaceY: UnderlyingSpace;
  posScales: [
    ((pos: number) => number) | undefined,
    ((pos: number) => number) | undefined,
  ];
  ordinalScales: [OrdinalScale | undefined, OrdinalScale | undefined];
  child: GoFishNode;
}> {
  child = await child;

  // Restore contexts after await - they may have been cleared by another concurrent runGofish
  if (contexts) {
    scaleContext = contexts.scaleCtx;
    scopeContext = contexts.scopeCtx;
    keyContext = contexts.keyCtx;
  }
  if (
    typeof document !== "undefined" &&
    document.fonts &&
    typeof document.fonts.ready?.then === "function"
  ) {
    await document.fonts.ready;
  }
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
  const sizeDomains = child.inferSizeDomains();
  const [underlyingSpaceX, underlyingSpaceY] = child.resolveUnderlyingSpace();

  // Apply nice rounding to POSITION space domains
  let niceUnderlyingSpaceX = underlyingSpaceX;
  let niceUnderlyingSpaceY = underlyingSpaceY;

  if (isPOSITION(underlyingSpaceX) && underlyingSpaceX.domain) {
    const [niceMin, niceMax] = nice(
      underlyingSpaceX.domain.min,
      underlyingSpaceX.domain.max,
      10
    );
    niceUnderlyingSpaceX = {
      ...underlyingSpaceX,
      domain: interval(niceMin, niceMax),
    };
  }

  if (isPOSITION(underlyingSpaceY) && underlyingSpaceY.domain) {
    const [niceMin, niceMax] = nice(
      underlyingSpaceY.domain.min,
      underlyingSpaceY.domain.max,
      10
    );
    niceUnderlyingSpaceY = {
      ...underlyingSpaceY,
      domain: interval(niceMin, niceMax),
    };
  }

  if (debug) {
    console.log("🌳 Underlying Space Tree:");
    debugUnderlyingSpaceTree(child);
  }

  const posScales: [
    ((pos: number) => number) | undefined,
    ((pos: number) => number) | undefined,
  ] = [
    niceUnderlyingSpaceX.kind === "position"
      ? computePosScale(
          continuous({
            value: [
              niceUnderlyingSpaceX.domain!.min,
              niceUnderlyingSpaceX.domain!.max,
            ],
            measure: "unit",
          }),
          w
        )
      : undefined,
    niceUnderlyingSpaceY.kind === "position"
      ? computePosScale(
          continuous({
            value: [
              niceUnderlyingSpaceY.domain!.min,
              niceUnderlyingSpaceY.domain!.max,
            ],
            measure: "unit",
          }),
          h
        )
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

  const ordinalScales: [OrdinalScale | undefined, OrdinalScale | undefined] = [
    isORDINAL(niceUnderlyingSpaceX) && keyContext
      ? buildOrdinalScaleX(keyContext, child)
      : undefined,
    isORDINAL(niceUnderlyingSpaceY) && keyContext
      ? buildOrdinalScaleY(keyContext, child)
      : undefined,
  ];

  return {
    sizeDomains,
    underlyingSpaceX: niceUnderlyingSpaceX,
    underlyingSpaceY: niceUnderlyingSpaceY,
    posScales,
    ordinalScales,
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
    posScales: [
      ((pos: number) => number) | undefined,
      ((pos: number) => number) | undefined,
    ];
    ordinalScales: [OrdinalScale | undefined, OrdinalScale | undefined];
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

      // Capture context references to pass to layout - they will be restored after await
      const contexts = {
        scaleCtx: scaleContext!,
        scopeCtx: scopeContext!,
        keyCtx: keyContext!,
      };

      const layoutResult = await layout(
        { w, h, x, y, transform, debug, defs, axes },
        child,
        contexts
      );

      const result = {
        ...layoutResult,
        // Use the captured contexts, not the module variable which may have been overwritten
        scaleContext: contexts.scaleCtx,
        keyContext: contexts.keyCtx,
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
              ordinalScales: data.ordinalScales,
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

/**
 * Finds the translation from the top-level coord node.
 * Checks the node itself first, then its immediate children.
 * Returns the coord node's transform.translate values, or null if not found.
 */
function findCoordTranslation(node: GoFishNode): [number, number] | null {
  // Check if the node itself is a coord node
  if (node.type === "coord" && node.transform?.translate) {
    return [
      node.transform.translate[0] ?? 0,
      node.transform.translate[1] ?? 0,
    ];
  }

  // Check immediate children for a coord node
  if (node.children) {
    for (const child of node.children) {
      // Check if child is a coord node (coord nodes are always GoFishNode, not GoFishRef)
      if ("type" in child && child.type === "coord" && "transform" in child) {
        const coordNode = child as GoFishNode;
        if (coordNode.transform?.translate) {
          return [
            coordNode.transform.translate[0] ?? 0,
            coordNode.transform.translate[1] ?? 0,
          ];
        }
      }
    }
  }

  return null;
}

/**
 * Finds the coordinate-space bounding box from the top-level coord node.
 * Checks the node itself first, then its immediate children.
 * Returns the coord node's coordinate-space bounding box, or null if not found.
 */
function findCoordBoundingBox(
  node: GoFishNode
): { thetaMin: number; thetaMax: number; rMin: number; rMax: number } | null {
  // Check if the node itself is a coord node
  if (node.type === "coord" && node.renderData?.coordinateSpaceBbox) {
    return node.renderData.coordinateSpaceBbox;
  }

  // Check immediate children for a coord node
  if (node.children) {
    for (const child of node.children) {
      // Check if child is a coord node (coord nodes are always GoFishNode, not GoFishRef)
      if ("type" in child && child.type === "coord" && "renderData" in child) {
        const coordNode = child as GoFishNode;
        if (coordNode.renderData?.coordinateSpaceBbox) {
          return coordNode.renderData.coordinateSpaceBbox;
        }
      }
    }
  }

  return null;
}

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
    ordinalScales,
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
    posScales: [
      ((pos: number) => number) | undefined,
      ((pos: number) => number) | undefined,
    ];
    ordinalScales: [OrdinalScale | undefined, OrdinalScale | undefined];
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
          {(() => {
            // Check if we have a coordinate transform (polar/clock coordinates)
            const hasCoordTransform =
              (isPOSITION(underlyingSpaceX) &&
                underlyingSpaceX.coordinateTransform) ||
              (isPOSITION(underlyingSpaceY) &&
                underlyingSpaceY.coordinateTransform);
            
            // Find the coord node's translation if we have a coordinate transform
            const coordTranslation = hasCoordTransform
              ? findCoordTranslation(child)
              : null;
            
            // Apply translation if found
            const axesTransform = coordTranslation
              ? `translate(${coordTranslation[0]}, ${coordTranslation[1]})`
              : undefined;
            
            return (
              <>
              <g transform={axesTransform}>
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
                if (!isPOSITION(underlyingSpaceY)) return null;
                const spaceY = underlyingSpaceY; // Type narrowed to POSITION_TYPE
                const xPosScale = posScales[0];
                const yPosScale = posScales[1];
                const [yMin, yMax] = nice(
                  spaceY.domain.min,
                  spaceY.domain.max,
                  10
                );
                const yTicks = ticks(yMin, yMax, 10);
                const coordTransform = spaceY.coordinateTransform;

                if (coordTransform && xPosScale && yPosScale) {
                  // Map using posScales before applying coordinate transform
                  const xDomainMin = coordTransform.domain[0].min!;
                  const screenYMin = yPosScale(yMin);
                  const screenYMax = yPosScale(yMax);
                  const screenX = xPosScale(xDomainMin);

                  // Create path in screen space, then transform
                  const screenPath = path(
                    [
                      [screenX, screenYMin],
                      [screenX, screenYMax],
                    ],
                    { subdivision: 100 }
                  );
                  const axisLinePath = transformPath(
                    screenPath,
                    coordTransform
                  );

                  return (
                    <g>
                      <path
                        d={pathToSVGPath(axisLinePath)}
                        stroke="gray"
                        stroke-width="1px"
                        fill="none"
                      />
                      <For each={yTicks}>
                        {(tick) => {
                          const screenTickY = yPosScale(tick);
                          const [transformedX, transformedY] =
                            coordTransform.transform([screenX, screenTickY]);
                          return (
                            <>
                              <text
                                transform="scale(1, -1)"
                                x={transformedX - PADDING * 0.25}
                                y={-transformedY}
                                text-anchor="end"
                                dominant-baseline="middle"
                                font-size="10px"
                                fill="gray"
                              >
                                {tick}
                              </text>
                              {/* Tick mark - create a small line from the axis */}
                              <line
                                x1={transformedX}
                                y1={transformedY}
                                x2={transformedX - PADDING * 0.5}
                                y2={transformedY}
                                stroke="gray"
                              />
                            </>
                          );
                        }}
                      </For>
                    </g>
                  );
                } else {
                  // Standard cartesian y-axis
                  if (!yPosScale) return null;
                  return (
                    <g>
                      <line
                        x1={-PADDING}
                        y1={yPosScale(yTicks[0]) - 0.5}
                        x2={-PADDING}
                        y2={yPosScale(yTicks[yTicks.length - 1]) + 0.5}
                        stroke="gray"
                        stroke-width="1px"
                      />
                      <For each={yTicks}>
                        {(tick) => (
                          <>
                            <text
                              transform="scale(1, -1)"
                              x={-PADDING * 1.75}
                              y={-yPosScale(tick)}
                              text-anchor="end"
                              dominant-baseline="middle"
                              font-size="10px"
                              fill="gray"
                            >
                              {tick}
                            </text>
                            <line
                              x1={-PADDING * 1.5}
                              y1={yPosScale(tick)}
                              x2={-PADDING}
                              y2={yPosScale(tick)}
                              stroke="gray"
                            />
                          </>
                        )}
                      </For>
                    </g>
                  );
                }
              })()}
            </Show>
            <Show
              when={
                isDIFFERENCE(underlyingSpaceY) &&
                scaleContext?.y &&
                "scaleFactor" in scaleContext.y
              }
            >
              {(() => {
                const yScale = scaleContext!.y as {
                  domain: [number, number];
                  scaleFactor: number;
                };
                if (!isDIFFERENCE(underlyingSpaceY)) return null;
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
                if (!isPOSITION(underlyingSpaceX)) return null;
                const spaceX = underlyingSpaceX; // Type narrowed to POSITION_TYPE
                const xPosScale = posScales[0];
                const [xMin, xMax] = nice(
                  spaceX.domain.min,
                  spaceX.domain.max,
                  10
                );
                const xTicks = ticks(xMin, xMax, 10);
                const coordTransform = spaceX.coordinateTransform;

                if (coordTransform && xPosScale) {
                  // Map the chart's data domain into the coordinate-space theta range.
                  // For clock/polar, the coord transform expects theta in [0, 2π] (or whatever its domain says),
                  // not raw data-domain values.
                  const thetaSize =
                    coordTransform.domain[0].size ??
                    (coordTransform.domain[0].max! - coordTransform.domain[0].min!);
                  const thetaScale = computePosScale(
                    continuous({
                      value: [xMin, xMax],
                      measure: "unit",
                    }),
                    thetaSize
                  );

                  const thetaMin = thetaScale(xMin);
                  const thetaMax = thetaScale(xMax);
                  
                  // Get the maximum radius from the coordinate-space bounding box
                  // and add padding to position axis outside chart bounds
                  const coordBbox = findCoordBoundingBox(child);
                  const rMax = coordBbox
                    ? coordBbox.rMax + PADDING * 2
                    : coordTransform.domain[1].max ??
                      coordTransform.domain[1].size ??
                      100;

                  const rAxis = rMax;
                  const tickLen = PADDING * 0.5;
                  const labelPad = PADDING * 1.25;

                  const axisDomainPath = path(
                    [
                      [thetaMin, rMax],
                      [thetaMax, rMax],
                    ],
                    { subdivision: 200 }
                  );

                  const axisLinePath = transformPath(
                    axisDomainPath,
                    coordTransform
                  );

                  return (
                    <g>
                      <path
                        d={pathToSVGPath(axisLinePath)}
                        stroke="gray"
                        stroke-width="1px"
                        fill="none"
                      />
                      <For each={xTicks}>
                        {(tick) => {
                          const thetaTick = thetaScale(tick);
                          // Ticks/labels should point outward (increasing r), regardless of how the
                          // coordinate transform distorts the space. Compute direction in screen space
                          // by sampling at r and r+Δr.
                          const [tickAxisX, tickAxisY] = coordTransform.transform([
                            thetaTick,
                            rAxis,
                          ]);
                          const [tickOutX, tickOutY] = coordTransform.transform([
                            thetaTick,
                            rAxis + tickLen,
                          ]);

                          const dx = tickOutX - tickAxisX;
                          const dy = tickOutY - tickAxisY;
                          const dLen = Math.hypot(dx, dy);
                          const dirX = dLen > 1e-6 ? dx / dLen : 0;
                          const dirY = dLen > 1e-6 ? dy / dLen : 1;

                          const labelX = tickOutX + dirX * labelPad;
                          const labelY = tickOutY + dirY * labelPad;
                          return (
                            <>
                              <text
                                transform="scale(1, -1)"
                                x={labelX}
                                y={-labelY}
                                text-anchor="middle"
                                dominant-baseline="hanging"
                                font-size="10px"
                                fill="gray"
                              >
                                {tick}
                              </text>
                              {/* Tick mark - create a small line from the axis */}
                              <line
                                x1={tickAxisX}
                                y1={tickAxisY}
                                x2={tickOutX}
                                y2={tickOutY}
                                stroke="gray"
                              />
                            </>
                          );
                        }}
                      </For>
                    </g>
                  );
                } else {
                  // Standard cartesian x-axis
                  if (!xPosScale) return null;
                  return (
                    <g>
                      <line
                        x1={xPosScale(xTicks[0]) - 0.5}
                        y1={-PADDING}
                        x2={xPosScale(xTicks[xTicks.length - 1]) + 0.5}
                        y2={-PADDING}
                        stroke="gray"
                        stroke-width="1px"
                      />
                      <For each={xTicks}>
                        {(tick) => (
                          <>
                            <text
                              transform="scale(1, -1)"
                              x={xPosScale(tick)}
                              y={PADDING * 1.75}
                              text-anchor="middle"
                              dominant-baseline="hanging"
                              font-size="10px"
                              fill="gray"
                            >
                              {tick}
                            </text>
                            <line
                              x1={xPosScale(tick)}
                              y1={-PADDING}
                              x2={xPosScale(tick)}
                              y2={-PADDING * 1.5}
                              stroke="gray"
                            />
                          </>
                        )}
                      </For>
                    </g>
                  );
                }
              })()}
            </Show>

            {/* x axis (difference) */}
            <Show
              when={
                isDIFFERENCE(underlyingSpaceX) &&
                scaleContext?.x &&
                "scaleFactor" in scaleContext.x
              }
            >
              {(() => {
                const xScale = scaleContext!.x as {
                  domain: [number, number];
                  scaleFactor: number;
                };
                if (!isDIFFERENCE(underlyingSpaceX)) return null;
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
            <Show
              when={
                axes &&
                isORDINAL(underlyingSpaceX) &&
                ordinalScales[0] &&
                keyContext
              }
            >
              {(() => {
                const scale = ordinalScales[0]!;
                // Use domain from ORDINAL space for top-level keys
                const domain = isORDINAL(underlyingSpaceX)
                  ? underlyingSpaceX.domain
                  : undefined;
                const labelKeys = domain && domain.length > 0 ? domain : [];
                // Get the minimum Y position for label placement
                const entries = Object.entries(keyContext ?? {});
                const minY = entries.reduce((min, [, node]) => {
                  if (!("intrinsicDims" in node) || !node.intrinsicDims)
                    return min;
                  const pathToRoot = findPathToRoot(node);
                  const accumulatedTransform = pathToRoot.reduce(
                    (acc, n) => {
                      return {
                        x: acc.x + (n.transform?.translate?.[0] ?? 0),
                        y: acc.y + (n.transform?.translate?.[1] ?? 0),
                      };
                    },
                    { x: 0, y: 0 }
                  );
                  const yPos =
                    accumulatedTransform.y + (node.intrinsicDims[1]?.min ?? 0);
                  return Math.min(min, yPos);
                }, Infinity);
                return (
                  <g>
                    <For each={labelKeys}>
                      {(key) => {
                        const xPos = scale(key);
                        if (xPos === undefined) return null;
                        return (
                          <text
                            transform="scale(1, -1)"
                            x={xPos}
                            y={-minY + 5}
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
                );
              })()}
            </Show>
            <Show
              when={
                axes &&
                isORDINAL(underlyingSpaceY) &&
                ordinalScales[1] &&
                keyContext
              }
            >
              {(() => {
                const scale = ordinalScales[1]!;
                // Use domain from ORDINAL space for top-level keys
                const domain = isORDINAL(underlyingSpaceY)
                  ? underlyingSpaceY.domain
                  : undefined;
                const labelKeys = domain && domain.length > 0 ? domain : [];
                // Get the minimum X position for label placement
                const entries = Object.entries(keyContext ?? {});
                const minX = entries.reduce((min, [, node]) => {
                  if (!("intrinsicDims" in node) || !node.intrinsicDims)
                    return min;
                  const pathToRoot = findPathToRoot(node);
                  const accumulatedTransform = pathToRoot.reduce(
                    (acc, n) => {
                      return {
                        x: acc.x + (n.transform?.translate?.[0] ?? 0),
                        y: acc.y + (n.transform?.translate?.[1] ?? 0),
                      };
                    },
                    { x: 0, y: 0 }
                  );
                  const xPos =
                    accumulatedTransform.x + (node.intrinsicDims[0]?.min ?? 0);
                  return Math.min(min, xPos);
                }, Infinity);
                return (
                  <g>
                    <For each={labelKeys}>
                      {(key) => {
                        const yPos = scale(key);
                        if (yPos === undefined) return null;
                        return (
                          <text
                            transform="scale(1, -1)"
                            x={minX - 5}
                            y={-yPos}
                            text-anchor="end"
                            dominant-baseline="middle"
                            font-size="10px"
                            fill="gray"
                          >
                            {key}
                          </text>
                        );
                      }}
                    </For>
                  </g>
                );
              })()}
            </Show>
              </g>
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
              </>
            );
          })()}
        </Show>
      </g>
    </svg>
  );

  // Clean up global contexts (they're already null from runGofish's finally block, but be explicit)
  scaleContext = null;
  keyContext = null;

  return result;
};
