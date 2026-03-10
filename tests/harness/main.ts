/**
 * Test harness entry point.
 *
 * Reads a chart spec (IR + data + options) from `window.__GOFISH_SPEC__`
 * and renders it using the GoFish v3 API. For derive operators, calls out
 * to the Python derive server over HTTP instead of AnyWidget RPC.
 *
 * The caller (Playwright) sets __GOFISH_SPEC__ via page.evaluate() and then
 * waits for window.__GOFISH_RENDER_COMPLETE__ to be set to true.
 */

import {
  Chart,
  spread,
  stack,
  scatter,
  group,
  derive,
  rect,
  circle,
  line,
  area,
  scaffold,
  type Operator,
  type Mark,
} from "gofish-graphics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HarnessSpec {
  data: Record<string, any>[];
  operators: OperatorSpec[];
  mark: MarkSpec;
  options: Record<string, any>;
  deriveServerUrl?: string;
}

interface OperatorSpec {
  type: string;
  lambdaId?: string;
  [key: string]: any;
}

interface MarkSpec {
  type: string;
  [key: string]: any;
}

declare global {
  interface Window {
    __GOFISH_SPEC__: HarnessSpec | null;
    __GOFISH_RENDER_COMPLETE__: boolean;
    __GOFISH_RENDER_ERROR__: string | null;
    __renderChart__: (spec: HarnessSpec) => void;
  }
}

// ---------------------------------------------------------------------------
// Operator mapping (mirrors widget-src/index.ts but uses HTTP for derive)
// ---------------------------------------------------------------------------

function mapOperator(
  op: OperatorSpec,
  deriveServerUrl?: string
): Operator<any, any> | null {
  const { type, ...opts } = op;

  switch (type) {
    case "derive": {
      const lambdaId = opts.lambdaId;
      if (!lambdaId) throw new Error("derive operator missing lambdaId");
      if (!deriveServerUrl)
        throw new Error("derive operator requires deriveServerUrl");

      return derive(async (d: any) => {
        const rows = Array.isArray(d) ? d : d == null ? [] : [d];
        if (rows.length === 0) return Array.isArray(d) ? d : (d ?? null);

        const resp = await fetch(`${deriveServerUrl}/derive/${lambdaId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows),
        });

        if (!resp.ok) {
          throw new Error(
            `Derive server error: ${resp.status} ${await resp.text()}`
          );
        }

        const result = await resp.json();
        return Array.isArray(d) ? result : (result[0] ?? null);
      });
    }
    case "spread": {
      const { field, ...rest } = opts;
      return field ? spread(field, rest) : spread(rest);
    }
    case "stack": {
      const { field, dir, ...rest } = opts;
      return stack(field, { dir, ...rest });
    }
    case "group":
      return group(opts.field);
    case "scatter": {
      const { field, x, y, ...rest } = opts;
      return scatter(field, { x, y, ...rest });
    }
    default:
      console.warn(`Unknown operator type: ${type}`);
      return null;
  }
}

const MARK_MAP: Record<string, (opts: Record<string, any>) => Mark<any>> = {
  rect: (opts) => rect(opts),
  circle: (opts) => circle(opts),
  line: (opts) => line(opts),
  area: (opts) => area(opts),
  scaffold: (opts) => scaffold(opts),
};

function mapMark(spec: MarkSpec): Mark<any> {
  const { type, ...opts } = spec;
  const factory = MARK_MAP[type];
  if (!factory) throw new Error(`Unknown mark type: ${type}`);
  return factory(opts);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderChart(spec: HarnessSpec) {
  const container = document.getElementById("gofish-harness-root");
  if (!container) {
    window.__GOFISH_RENDER_ERROR__ = "Container not found";
    window.__GOFISH_RENDER_COMPLETE__ = true;
    return;
  }

  try {
    const operators: Operator<any, any>[] = [];
    for (const opSpec of spec.operators || []) {
      const op = mapOperator(opSpec, spec.deriveServerUrl);
      if (op) operators.push(op);
    }

    const mark = mapMark(spec.mark);

    const builder = Chart(spec.data, spec.options || {});
    const node = builder.flow(...operators).mark(mark);

    const { w, h, axes, debug, ...restOpts } = spec.options || {};
    node.render(container, {
      w: w ?? 400,
      h: h ?? 400,
      axes: axes ?? false,
      debug: debug ?? false,
      ...restOpts,
    });

    // Allow a tick for SolidJS to flush renders
    requestAnimationFrame(() => {
      window.__GOFISH_RENDER_COMPLETE__ = true;
    });
  } catch (err) {
    window.__GOFISH_RENDER_ERROR__ =
      err instanceof Error ? err.message : String(err);
    window.__GOFISH_RENDER_COMPLETE__ = true;
  }
}

// Expose globally so Playwright can call it
window.__renderChart__ = renderChart;
window.__GOFISH_RENDER_COMPLETE__ = false;
window.__GOFISH_RENDER_ERROR__ = null;

// If spec is already set (e.g., via inline script), render immediately
if (window.__GOFISH_SPEC__) {
  renderChart(window.__GOFISH_SPEC__);
}
