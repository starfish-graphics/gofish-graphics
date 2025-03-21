import { Show, type JSX } from "solid-js";
import type { GoFishNode } from "./_node";
import { ScopeContext } from "./scopeContext";

let scopeContext: ScopeContext | null = null;

export const getScopeContext = (): ScopeContext => {
  if (!scopeContext) {
    throw new Error("Scope context not set");
  }
  return scopeContext;
};

/* global pass handler */
export const gofish = (
  { width, height, transform }: { width: number; height: number; transform?: { x?: number; y?: number } },
  child: GoFishNode
) => {
  scopeContext = new Map();

  try {
    // const domainAST = child.inferDomain();
    // const sizeThatFitsAST = domainAST.sizeThatFits();
    // const layoutAST = sizeThatFitsAST.layout();
    // return render({ width, height, transform }, layoutAST);
    child.resolveNames();
    child.measure([width, height])([undefined, undefined]);
    child.layout([width, height], [undefined, undefined]);
    child.place({ x: transform?.x ?? 0, y: transform?.y ?? 0 });
    return render({ width, height }, child);
  } finally {
    console.log("scopeContext", scopeContext);
    scopeContext = null;
  }
};

export const render = (
  { width, height, transform }: { width: number; height: number; transform?: string },
  child: GoFishNode
): JSX.Element => (
  <svg width={width} height={height}>
    <defs>
      <filter id="crumpled-paper" x="-20%" y="-20%" width="140%" height="140%">
        {/* <!-- Create subtle texture with turbulence (shape-preserving) --> */}
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="3" result="noise" />

        {/* <!-- Significantly reduce displacement to preserve element shape --> */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="displacedPaper"
        />

        {/* <!-- Add light effect with lighting --> */}
        <feDiffuseLighting in="noise" surfaceScale="3" diffuseConstant="1" result="diffLight">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>

        {/* <!-- Adjust the contrast of the lighting --> */}
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

        {/* <!-- Blend the lighting with the displaced image --> */}
        <feBlend in="displacedPaper" in2="lightedPaper" mode="multiply" result="crumpledPaper" />

        {/* <!-- Add subtle color variation to simulate paper fibers --> */}
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
    </defs>
    <Show when={transform} keyed fallback={child.render()}>
      <g transform={transform ?? ""}>{child.render()}</g>
    </Show>
  </svg>
);
