/**
 * GoFish Python Widget - Self-contained ESM bundle entry point
 *
 * This module is the single source of widget logic. It will be bundled
 * with dependencies (gofish-graphics, solid-js, apache-arrow) at build time.
 */

import * as Arrow from "apache-arrow";
import {
  chart,
  spread,
  stack,
  scatter,
  group,
  derive,
  rect,
  circle,
  line,
  scaffold,
  area,
  type ChartBuilder,
  type Operator,
  type Mark,
} from "gofish-graphics";

// Type definitions for widget model and IR
interface WidgetModel {
  get(key: "spec"): ChartSpec;
  get(key: "arrow_data"): string; // base64-encoded Arrow IPC bytes
  get(key: "width"): number;
  get(key: "height"): number;
  get(key: "axes"): boolean;
  get(key: "debug"): boolean;
  get(key: "container_id"): string;
}

interface ExperimentalAPI {
  invoke<T = any>(
    name: string,
    msg?: any,
    buffers?: DataView[]
  ): Promise<[T, DataView[]]>;
}

interface ChartSpec {
  operators?: OperatorSpec[];
  mark: MarkSpec;
  options?: Record<string, any>;
}

interface OperatorSpec {
  type: "derive" | "spread" | "stack" | "group" | "scatter";
  lambdaId?: string;
  [key: string]: any;
}

interface MarkSpec {
  type: "rect" | "circle" | "line" | "area" | "scaffold";
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

    return derive(async (d: any) => {
      const rows = normalizeToArray(d);
      if (rows.length === 0) {
        return Array.isArray(d) ? d : (d ?? null);
      }

      const arrowBuffer = arrayToArrow(rows);
      const arrowB64 = btoa(String.fromCharCode(...arrowBuffer));

      // Use experimental.invoke to call Python command
      const [response] = await experimental.invoke<{ resultB64: string }>(
        "_execute_derive",
        {
          lambdaId,
          arrowB64,
        }
      );

      const resultB64 = response?.resultB64;
      if (typeof resultB64 !== "string") {
        throw new Error("Invalid executeDerive response from Python");
      }
      const resultBuffer = Uint8Array.from(atob(resultB64), (c) =>
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
  ) => {
    const { field, ...rest } = opts;
    return field ? spread(field, rest) : spread(rest);
  },
  stack: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => {
    const { field, dir, ...rest } = opts;
    return stack(field, { dir, ...rest });
  },
  group: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => {
    return group(opts.field);
  },
  scatter: (
    opts: Record<string, any>,
    _model: WidgetModel,
    _experimental: ExperimentalAPI
  ) => {
    const { field, x, y, ...rest } = opts;
    return scatter(field, { x, y, ...rest });
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
  scaffold: (opts: Record<string, any>) => scaffold(opts),
};

/**
 * Maps an IR mark spec to a GoFish mark function.
 */
function mapMark(markSpec: MarkSpec): Mark<any> {
  const { type, ...opts } = markSpec;
  const factory = MARK_MAP[type];
  if (!factory) {
    throw new Error(`Unknown mark type: ${type}`);
  }
  return factory(opts);
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

// Main chart rendering function
/**
 * Renders a GoFish chart from widget model state.
 */
function renderChart(
  model: WidgetModel,
  container: HTMLElement,
  experimental: ExperimentalAPI
): void {
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
      const arrowBuffer = Uint8Array.from(atob(arrowDataB64), (c) =>
        c.charCodeAt(0)
      );
      const table = Arrow.tableFromIPC(arrowBuffer);
      log(`Arrow table: ${table.numRows} rows`);
      data = arrowTableToArray(table);
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

  // 2. Map IR operators to GoFish operators
  const spec = model.get("spec");
  log("Processing spec:", spec);
  const operators: Operator<any, any>[] = [];

  for (const opSpec of spec.operators || []) {
    log(`Mapping operator: ${opSpec.type}`);
    const op = mapOperator(opSpec, model, experimental);
    if (op) {
      operators.push(op);
    } else {
      log(`Warning: Unknown operator type: ${opSpec.type}`);
    }
  }

  // 3. Map IR mark to GoFish mark
  const markSpec = spec.mark || { type: "rect" };
  log(`Mapping mark: ${markSpec.type}`);
  const mark = mapMark(markSpec);

  // 4. Build and render chart
  try {
    log("Building chart...");
    const chartBuilder = chart(data, spec.options || {});
    let node = chartBuilder.flow(...operators).mark(mark);

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
