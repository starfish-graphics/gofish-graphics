/**
 * GoFish Python Widget - Self-contained ESM bundle entry point
 *
 * This module is the single source of widget logic. It will be bundled
 * with dependencies (gofish-graphics, solid-js, apache-arrow) at build time.
 */

import * as Arrow from "apache-arrow";
import {
  Chart as chart,
  Layer,
  clock,
  spread,
  stack,
  scatter,
  group,
  table,
  derive,
  log,
  select,
  palette,
  gradient,
  rect,
  circle,
  line,
  blank,
  area,
  ellipse,
  petal,
  text,
  image,
  type ChartBuilder,
  type Operator,
  type Mark,
} from "gofish-graphics";

// Type definitions for widget model and IR
interface WidgetModel {
  get(key: "spec"): ChartSpec | LayerSpec;
  get(key: "arrow_data"): string; // base64-encoded Arrow IPC bytes (or JSON dict for layer)
  get(key: "width"): number;
  get(key: "height"): number;
  get(key: "axes"): boolean;
  get(key: "debug"): boolean;
  get(key: "container_id"): string;
  get(key: "derive_response"): { requestId: string; resultB64: string } | null;
  set(key: string, value: any): void;
  save_changes(): void;
  on(event: string, callback: () => void): void;
}

interface ExperimentalAPI {
  invoke<T = any>(
    name: string,
    msg?: any,
    buffers?: DataView[]
  ): Promise<[T, DataView[]]>;
}

interface SelectSpec {
  type: "select";
  layer: string;
}

interface ChartSpec {
  type?: string;
  data?: SelectSpec | null;
  operators?: OperatorSpec[];
  mark: MarkSpec;
  options?: Record<string, any>;
  zOrder?: number;
}

interface LayerSpec {
  type: "layer";
  charts: ChartSpec[];
  options?: Record<string, any>;
}

interface OperatorSpec {
  type: "derive" | "spread" | "stack" | "group" | "scatter" | "table" | "log";
  lambdaId?: string;
  [key: string]: any;
}

interface LabelSpec {
  accessor: string;
  position?: string;
  fontSize?: number;
  color?: string;
  offset?: number;
  minSpace?: number;
  rotate?: number;
}

interface MarkSpec {
  type:
    | "rect"
    | "circle"
    | "line"
    | "area"
    | "blank"
    | "ellipse"
    | "petal"
    | "text"
    | "image";
  name?: string;
  label?: LabelSpec;
  [key: string]: any;
}

interface RenderOptions {
  w: number;
  h: number;
  axes: boolean;
  debug: boolean;
}

// Arrow conversion helper
/**
 * Converts Arrow IPC bytes to an array of plain objects.
 */
function arrowTableToArray(table: Arrow.Table): Record<string, any>[] {
  const numRows = table.numRows;
  const columns = table.schema.fields.map((field, i) => {
    const column = table.getChildAt(i);
    const values = column.toArray();
    return {
      name: field.name,
      type: field.type,
      values: values,
    };
  });

  const data: Record<string, any>[] = [];
  for (let i = 0; i < numRows; i++) {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      let value = col.values[i];
      // Convert BigInt to Number if needed
      if (typeof value === "bigint") {
        value = Number(value);
      } else if (value !== null && value !== undefined) {
        const typeStr = col.type ? col.type.toString() : "";
        if (
          typeStr.includes("Int64") ||
          typeStr.includes("UInt64") ||
          typeStr.includes("Int32") ||
          typeStr.includes("UInt32")
        ) {
          value = Number(value);
        }
      }
      row[col.name] = value;
    });
    data.push(row);
  }
  return data;
}

/**
 * Normalizes a value to an array for Arrow conversion.
 */
function normalizeToArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

/**
 * Converts an array of objects to Arrow IPC (Uint8Array).
 * Requires at least one row; callers should guard empty arrays.
 *
 * This matches the implementation of Arrow's tableToIPC function:
 * RecordBatchStreamWriter.writeAll(table).toUint8Array(true)
 */
function arrayToArrow(rows: Record<string, any>[]): Uint8Array {
  if (!rows || rows.length === 0) {
    throw new Error("Cannot serialize empty data to Arrow");
  }

  const table = Arrow.tableFromJSON(rows);
  let buffer: Uint8Array | ArrayBuffer | null = null;

  try {
    // Try tableToIPC if available (simplest method)
    if (
      (Arrow as any).tableToIPC &&
      typeof (Arrow as any).tableToIPC === "function"
    ) {
      buffer = (Arrow as any).tableToIPC(table);
      if (buffer && buffer.byteLength > 0) {
        return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      }
    }
  } catch (error) {
    // Fall through to direct approach
    console.warn("tableToIPC failed, trying direct approach:", error);
  }

  // Direct approach: RecordBatchStreamWriter.writeAll(table).toUint8Array(true)
  // This is what tableToIPC does internally
  try {
    const writer = (Arrow as any).RecordBatchStreamWriter;
    if (!writer || typeof writer.writeAll !== "function") {
      throw new Error("RecordBatchStreamWriter.writeAll is not available");
    }

    // writeAll accepts the table directly and returns a stream
    const stream = writer.writeAll(table);
    if (!stream) {
      throw new Error("writeAll returned null/undefined");
    }

    // The stream has a toUint8Array method that finishes the stream when passed true
    if (typeof stream.toUint8Array === "function") {
      buffer = stream.toUint8Array(true);
    } else if (typeof stream.finish === "function") {
      buffer = stream.finish();
    } else {
      throw new Error(
        "Stream from writeAll has neither toUint8Array nor finish method"
      );
    }

    if (!buffer || buffer.byteLength === 0) {
      throw new Error("Serialized Arrow buffer is empty");
    }

    return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  } catch (error) {
    throw new Error(
      `Failed to serialize Arrow table: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Module-level state for traitlet-based derive fallback
// null = untested, true = invoke works, false = use traitlet fallback
let useInvoke: boolean | null = null;
const pendingDerivesByModel = new WeakMap<
  object,
  Map<string, { resolve: (v: string) => void; reject: (e: Error) => void }>
>();
const listenerSetupByModel = new WeakSet<object>();

function setupDeriveResponseListener(model: WidgetModel): void {
  const key = model as object;
  if (listenerSetupByModel.has(key)) return;
  listenerSetupByModel.add(key);
  if (!pendingDerivesByModel.has(key)) {
    pendingDerivesByModel.set(key, new Map());
  }
  // Guard: marimo may not support model.on()
  if (typeof (model as any).on !== "function") return;
  model.on("change:derive_response", () => {
    const response = model.get("derive_response");
    if (!response?.requestId) return;
    const pending = pendingDerivesByModel.get(key);
    const handlers = pending?.get(response.requestId);
    if (handlers) {
      pending!.delete(response.requestId);
      handlers.resolve(response.resultB64);
    }
  });
}

// Operator mapping: IR operator specs -> GoFish API operators
/**
 * Lookup table mapping operator type to factory function.
 */
const OPERATOR_MAP: Record<
  string,
  (
    opts: Record<string, any>,
    model: WidgetModel,
    experimental: ExperimentalAPI
  ) => Operator<any, any> | null
> = {
  derive: (
    opts: Record<string, any>,
    model: WidgetModel,
    experimental: ExperimentalAPI
  ) => {
    const lambdaId = opts.lambdaId;

    if (!lambdaId) {
      throw new Error("derive operator missing lambdaId");
    }

    // Ensure traitlet response listener is set up for this model
    setupDeriveResponseListener(model);

    return derive(async (d: any) => {
      const rows = normalizeToArray(d);
      if (rows.length === 0) {
        return Array.isArray(d) ? d : (d ?? null);
      }

      const arrowBuffer = arrayToArrow(rows);
      const arrowB64 = btoa(String.fromCharCode(...arrowBuffer));

      let resultB64: string | undefined;

      // Fast path: try experimental.invoke (works in Jupyter, not in marimo)
      if (useInvoke !== false) {
        try {
          // Wrap in Promise.resolve to ensure synchronous throws become rejections
          const [response] = await Promise.resolve().then(() =>
            experimental.invoke<{ resultB64: string }>("_execute_derive", {
              lambdaId,
              arrowB64,
            })
          );
          useInvoke = true;
          const rb64 = response?.resultB64;
          if (typeof rb64 !== "string") {
            throw new Error("Invalid executeDerive response from Python");
          }
          resultB64 = rb64;
        } catch (err: any) {
          if (useInvoke === null) {
            // First attempt failed — invoke not supported, fall back to traitlets
            useInvoke = false;
          } else {
            throw err;
          }
        }
      }

      // Traitlet fallback: used when invoke is not supported (e.g. marimo)
      if (useInvoke === false) {
        if (
          typeof (model as any).set !== "function" ||
          typeof (model as any).save_changes !== "function"
        ) {
          throw new Error(
            "GoFish derive: neither experimental.invoke nor traitlet sync (model.set/save_changes) is available in this environment"
          );
        }
        const requestId = `r-${Math.random().toString(36).slice(2)}`;
        resultB64 = await new Promise<string>((resolve, reject) => {
          const pending = pendingDerivesByModel.get(model as object);
          if (!pending) {
            reject(
              new Error(
                "GoFish derive: pendingDerives map not initialized for this model"
              )
            );
            return;
          }
          pending.set(requestId, { resolve, reject });
          model.set("derive_request", { requestId, lambdaId, arrowB64 });
          model.save_changes();
        });
      }

      const resultBuffer = Uint8Array.from(atob(resultB64!), (c) =>
        c.charCodeAt(0)
      );
      const resultTable = Arrow.tableFromIPC(resultBuffer);
      const resultArray = arrowTableToArray(resultTable);

      if (Array.isArray(d)) {
        return resultArray;
      }

      return resultArray[0] ?? null;
    });
  },
  spread: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => spread(opts as any),
  stack: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => stack(opts as any),
  group: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => group(opts as any),
  scatter: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => scatter(opts as any),
  table: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => table(opts as any),
  log: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => {
    return log(opts.label);
  },
};

/**
 * Maps an IR operator spec to a GoFish operator function.
 */
function mapOperator(
  op: OperatorSpec,
  model: WidgetModel,
  experimental: ExperimentalAPI
): Operator<any, any> | null {
  const { type, ...opts } = op;
  const factory = OPERATOR_MAP[type];
  if (!factory) {
    return null;
  }
  return factory(opts, model, experimental);
}

// Mark mapping: IR mark spec -> GoFish API mark
/**
 * Lookup table mapping mark type to factory function.
 */
const MARK_MAP: Record<string, (opts: Record<string, any>) => Mark<any>> = {
  rect: (opts: Record<string, any>) => rect(opts),
  circle: (opts: Record<string, any>) => circle(opts),
  line: (opts: Record<string, any>) => line(opts),
  area: (opts: Record<string, any>) => area(opts),
  blank: (opts: Record<string, any>) => blank(opts),
  ellipse: (opts: Record<string, any>) => ellipse(opts),
  petal: (opts: Record<string, any>) => petal(opts),
  text: (opts: Record<string, any>) => text(opts),
  image: (opts: Record<string, any>) => image(opts),
};

/**
 * Maps an IR mark spec to a GoFish mark function, applying .name() and .label() if present.
 */
function mapMark(markSpec: MarkSpec): Mark<any> {
  const { type, name: layerName, label: labelSpec, ...opts } = markSpec;
  const factory = MARK_MAP[type];
  if (!factory) {
    throw new Error(`Unknown mark type: ${type}`);
  }
  let mark = factory(opts);
  if (layerName && typeof (mark as any).name === "function") {
    mark = (mark as any).name(layerName);
  }
  if (labelSpec && typeof (mark as any).label === "function") {
    const { accessor, ...labelOpts } = labelSpec;
    mark = (mark as any).label(
      accessor,
      Object.keys(labelOpts).length > 0 ? labelOpts : undefined
    );
  }
  return mark;
}

/**
 * Resolves a color config dict (with _tag) to a real palette() or gradient() call.
 */
function resolveColorConfig(colorSpec: Record<string, any>): any {
  if (colorSpec._tag === "palette") {
    return palette(colorSpec.values);
  } else if (colorSpec._tag === "gradient") {
    return gradient(colorSpec.stops);
  }
  return colorSpec;
}

/**
 * Resolves a coord config dict (with type) to a real coordinate transform.
 */
function resolveCoordConfig(coordSpec: Record<string, any>): any {
  if (coordSpec.type === "clock") {
    return clock();
  }
  return coordSpec;
}

/**
 * Resolves all known special values in an options dict (color, coord).
 */
function resolveOptions(raw: Record<string, any>): Record<string, any> {
  const resolved: Record<string, any> = { ...raw };
  if (
    resolved.color &&
    typeof resolved.color === "object" &&
    "_tag" in resolved.color
  ) {
    resolved.color = resolveColorConfig(resolved.color);
  }
  if (
    resolved.coord &&
    typeof resolved.coord === "object" &&
    "type" in resolved.coord
  ) {
    resolved.coord = resolveCoordConfig(resolved.coord);
  }
  return resolved;
}

// Error rendering helper
/**
 * Renders an error message to the container element.
 */
function renderError(
  container: HTMLElement,
  error: Error,
  debug: boolean
): void {
  const message = error.message || String(error);
  const stack = debug && error.stack ? error.stack : "";

  container.innerHTML = `
    <div style="color: red; padding: 20px; border: 2px solid red; background: #ffe0e0;">
      <h2 style="margin-top: 0;">GoFish Widget Error</h2>
      <p><strong>${message}</strong></p>
      ${stack ? `<pre style="background: #fff; padding: 10px; overflow: auto; white-space: pre-wrap;">${stack}</pre>` : ""}
    </div>
  `;
}

/**
 * Decodes a base64 Arrow IPC buffer to an array of data objects.
 */
function decodeArrowB64(b64: string): Record<string, any>[] {
  if (!b64) return [];
  const arrowBuffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const table = Arrow.tableFromIPC(arrowBuffer);
  return arrowTableToArray(table);
}

/**
 * Builds a ChartBuilder from a ChartSpec + resolved data array.
 */
function buildChart(
  chartSpec: ChartSpec,
  data: Record<string, any>[],
  model: WidgetModel,
  experimental: ExperimentalAPI
): ChartBuilder {
  const operators: Operator<any, any>[] = [];
  for (const opSpec of chartSpec.operators || []) {
    const op = mapOperator(opSpec, model, experimental);
    if (op) {
      operators.push(op);
    }
  }

  const markSpec = chartSpec.mark || { type: "rect" };
  const mark = mapMark(markSpec);

  const resolvedOptions = resolveOptions(chartSpec.options || {});

  let chartData: any = data;
  if (
    chartSpec.data &&
    typeof chartSpec.data === "object" &&
    chartSpec.data.type === "select"
  ) {
    chartData = select(chartSpec.data.layer);
  }

  let builder = chart(chartData, resolvedOptions)
    .flow(...operators)
    .mark(mark);
  if (chartSpec.zOrder !== undefined) {
    builder = builder.zOrder(chartSpec.zOrder);
  }
  return builder;
}

/**
 * Renders a Layer (multi-chart composition) from widget model state.
 */
function renderLayer(
  model: WidgetModel,
  container: HTMLElement,
  experimental: ExperimentalAPI
): void {
  const debug = model.get("debug");
  const log = debug
    ? (...args: any[]) => console.log("[GoFish Widget]", ...args)
    : () => {};

  log("Rendering layer...");

  const spec = model.get("spec") as LayerSpec;
  const arrowDataRaw = model.get("arrow_data");

  // Parse per-chart arrow data dict
  let arrowDict: Record<string, string> = {};
  try {
    arrowDict = JSON.parse(arrowDataRaw);
  } catch (e) {
    throw new Error(`Failed to parse layer arrow_data JSON: ${e}`);
  }

  // Build each child chart
  const childCharts: ChartBuilder[] = spec.charts.map(
    (chartSpec: ChartSpec, i: number) => {
      const b64 = arrowDict[String(i)] || "";
      const data = decodeArrowB64(b64);
      log(`Building chart ${i}: ${data.length} rows`);
      return buildChart(chartSpec, data, model, experimental);
    }
  );

  // Resolve layer-level options
  const rawOptions = spec.options || {};
  const resolvedLayerOptions = resolveOptions(rawOptions);
  const renderOptions: RenderOptions = {
    w: model.get("width"),
    h: model.get("height"),
    axes: model.get("axes"),
    debug: debug,
  };

  log("Calling Layer([...]).render()...");
  if (Object.keys(resolvedLayerOptions).length > 0) {
    Layer(resolvedLayerOptions, childCharts).render(container, renderOptions);
  } else {
    Layer(childCharts).render(container, renderOptions);
  }
  log("Layer rendered successfully!");
}

// Main chart rendering function
/**
 * Renders a GoFish chart from widget model state.
 */
function renderChart(
  model: WidgetModel,
  container: HTMLElement,
  experimental: ExperimentalAPI
): void {
  const spec = model.get("spec");

  // Dispatch to layer renderer if spec.type === "layer"
  if ((spec as any).type === "layer") {
    renderLayer(model, container, experimental);
    return;
  }

  const chartSpec = spec as ChartSpec;
  const debug = model.get("debug");

  // Log only if debug mode is enabled
  const log = debug
    ? (...args: any[]) => console.log("[GoFish Widget]", ...args)
    : () => {};

  log("Rendering chart...");

  // 1. Deserialize Arrow data
  let data: Record<string, any>[] = [];
  const arrowDataB64 = model.get("arrow_data");
  if (arrowDataB64) {
    try {
      log("Decoding Arrow data...");
      data = decodeArrowB64(arrowDataB64);
      log(`Converted to ${data.length} data objects`);
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error(`Failed to deserialize Arrow data: ${error}`);
      log("Error deserializing Arrow data:", err);
      throw err;
    }
  }

  log("Processing spec:", chartSpec);
  // 2. Build and render chart
  try {
    log("Building chart...");
    let node = buildChart(chartSpec, data, model, experimental);

    const renderOptions: RenderOptions = {
      w: model.get("width"),
      h: model.get("height"),
      axes: model.get("axes"),
      debug: debug,
    };
    log("Render options:", renderOptions);
    log("Calling node.render()...");
    node.render(container, renderOptions);
    log("Chart rendered successfully!");
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(`Failed to render chart: ${error}`);
    log("Error rendering chart:", err);
    throw err;
  }
}

// AnyWidget entry point
/**
 * Main render function for AnyWidget.
 * Accepts { model, el, experimental } from AnyWidget and renders the chart.
 */
export default {
  async render({
    model,
    el,
    experimental,
  }: {
    model: WidgetModel;
    el: HTMLElement;
    experimental: ExperimentalAPI;
  }) {
    const debug = model.get("debug");
    const log = debug
      ? (...args: any[]) => console.log("[GoFish Widget]", ...args)
      : () => {};

    log("render() called");

    // Get container ID
    const containerId = model.get("container_id");
    log(`Container ID: ${containerId}`);

    // Create container div
    el.innerHTML = `<div id="${containerId}"></div>`;
    // Query the container directly from el to avoid timing issues
    const container = el.querySelector(`#${containerId}`) as HTMLElement;
    if (!container) {
      const error = new Error(
        `Container with id "${containerId}" not found after creation`
      );
      renderError(el, error, debug);
      return;
    }

    // Render the chart with error handling
    try {
      renderChart(model, container, experimental);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      log("Error in render():", err);
      renderError(container, err, debug);
    }

    log("render() completed");
  },
};
