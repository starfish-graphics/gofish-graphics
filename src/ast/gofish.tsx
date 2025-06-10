import { Show, type JSX } from "solid-js";
import { render as solidRender } from "solid-js/web";
import { debugNodeTree, type GoFishNode } from "./_node";
import { ScopeContext } from "./scopeContext";
import { computePosScale } from "./domain";

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

/* global pass handler */
export const gofish = (
  container: HTMLElement,
  {
    width,
    height,
    transform,
    debug = false,
    defs,
  }: {
    width: number;
    height: number;
    transform?: { x?: number; y?: number };
    debug?: boolean;
    defs?: JSX.Element[];
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
    solidRender(() => render({ width, height, defs }, child), container);
    return container;
  } finally {
    scopeContext = null;
    scaleContext = null;
  }
};

const PADDING = 10;

export const render = (
  { width, height, transform, defs }: { width: number; height: number; transform?: string; defs?: JSX.Element[] },
  child: GoFishNode
): JSX.Element => (
  <svg width={width + PADDING * 2} height={height + PADDING * 2}>
    <Show when={defs}>
      <defs>{defs}</defs>
    </Show>
    <g transform={`translate(${PADDING}, ${PADDING})`}>
      {/* <defs>
      <filter id="crumpled-paper" x="-20%" y="-20%" width="140%" height="140%">
        <!-- Create subtle texture with turbulence (shape-preserving) -->
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="3" result="noise" />

        <!-- Significantly reduce displacement to preserve element shape -->
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="displacedPaper"
        />

        <!-- Add light effect with lighting -->
        <feDiffuseLighting in="noise" surfaceScale="3" diffuseConstant="1" result="diffLight">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>

        <!-- Adjust the contrast of the lighting -->
        <feComposite
          in="diffLight"
          in2="displacedPaper"
          operator="arithmetic"
          k1="1"
          k2="0"
          k3="0"
          k4="0"
          result="lightedPaper"
        />

        <!-- Blend the lighting with the displaced image -->
        <feBlend in="displacedPaper" in2="lightedPaper" mode="multiply" result="crumpledPaper" />

        <!-- Add subtle color variation to simulate paper fibers -->
        <feColorMatrix
          in="crumpledPaper"
          type="matrix"
          values="
        0.9 0.1 0.1 0 0
        0.1 0.9 0.1 0 0
        0.1 0.1 0.9 0 0
        0   0   0   1 0"
          result="coloredPaper"
        />
      </filter>
    </defs> */}
      <Show when={transform} keyed fallback={child.render()}>
        <g transform={transform ?? ""}>{child.render()}</g>
      </Show>
    </g>
  </svg>
);
