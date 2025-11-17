/**
 * Client-side renderer for GoFish charts.
 *
 * This script runs in the browser and renders charts using SolidJS.
 * It handles async derive operations by communicating with Python
 * via Jupyter comms (in Jupyter) or WebSocket (standalone).
 */

import * as GoFish from "gofish-graphics";
import * as Arrow from "apache-arrow";
import { createResource } from "solid-js";

// Helper function to convert Arrow table to array of objects
function arrowTableToArray(table) {
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

  const data = [];
  for (let i = 0; i < numRows; i++) {
    const row = {};
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

// Helper function to convert array to Arrow format
function arrayToArrow(data) {
  if (!data || data.length === 0) {
    throw new Error("Cannot convert empty array to Arrow");
  }

  const table = Arrow.tableFromJSON(data);

  // Serialize to IPC stream format
  let buffer;
  try {
    const batches = table.batches;
    if (!batches || batches.length === 0) {
      throw new Error("Table has no batches");
    }

    const writer = Arrow.RecordBatchStreamWriter.writeAll(
      table.schema,
      batches
    );
    buffer = writer.finish();
  } catch (e) {
    try {
      if (Arrow.tableToIPC) {
        buffer = Arrow.tableToIPC(table);
      } else if (Arrow.tableToIPCStreamWriter) {
        const writer = Arrow.tableToIPCStreamWriter(table);
        buffer = writer.finish();
      } else {
        throw new Error(
          `No suitable Arrow serialization method found: ${e.message}`
        );
      }
    } catch (e2) {
      throw new Error(
        `Unable to serialize Arrow table: ${e.message}, ${e2.message}`
      );
    }
  }

  if (buffer instanceof Uint8Array) {
    return buffer;
  }
  return new Uint8Array(buffer);
}

// Note: PythonComm class removed - derive operators are not supported in standalone HTML mode.
// For Jupyter, use the widget-based rendering which handles derive via anywidget.

// Main render function
export function renderChart(spec, arrowData, options, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container with id "${containerId}" not found`);
  }

  // Deserialize Arrow data
  let data;
  if (arrowData) {
    try {
      const arrowBuffer = Uint8Array.from(atob(arrowData), (c) =>
        c.charCodeAt(0)
      );
      const table = Arrow.tableFromIPC(arrowBuffer);
      data = arrowTableToArray(table);
    } catch (error) {
      console.error("[GoFish Derive] Error deserializing Arrow data:", error);
      throw error;
    }
  } else {
    data = spec.data || [];
  }

  // Import GoFish functions
  const {
    chart,
    spread,
    stack,
    derive,
    group,
    scatter,
    rect,
    circle,
    line,
    area,
    scaffold,
  } = GoFish;

  // Process operators and reconstruct them
  const reconstructedOps = [];

  for (const op of spec.operators || []) {
    let reconstructedOp = null;

    if (op.type === "derive") {
      // Derive operators are not supported in standalone HTML mode
      // They require Python execution which is only available in Jupyter via the widget
      console.warn(
        "[GoFish] Derive operators are not supported in standalone HTML mode. " +
        "Please use Jupyter notebook for derive functionality."
      );
      // Skip this operator - chart will render without the derive transformation
      // Alternatively, we could throw an error, but skipping is more graceful
      continue;
    } else if (op.type === "spread") {
      const { field, ...opts } = op;
      if (field) {
        reconstructedOp = spread(field, opts);
      } else {
        reconstructedOp = spread(opts);
      }
    } else if (op.type === "stack") {
      const { field, dir, ...opts } = op;
      reconstructedOp = stack(field, { dir, ...opts });
    } else if (op.type === "group") {
      reconstructedOp = group(op.field);
    } else if (op.type === "scatter") {
      const { field, x, y, ...opts } = op;
      reconstructedOp = scatter(field, { x, y, ...opts });
    }

    if (reconstructedOp) {
      reconstructedOps.push(reconstructedOp);
    }
  }

  // Reconstruct mark
  let reconstructedMark;
  const markSpec = spec.mark || {};
  if (markSpec.type === "rect") {
    reconstructedMark = rect(markSpec);
  } else if (markSpec.type === "circle") {
    reconstructedMark = circle(markSpec);
  } else if (markSpec.type === "line") {
    reconstructedMark = line(markSpec);
  } else if (markSpec.type === "area") {
    reconstructedMark = area(markSpec);
  } else if (markSpec.type === "scaffold") {
    reconstructedMark = scaffold(markSpec);
  } else {
    throw new Error(`Unknown mark type: ${markSpec.type}`);
  }

  // Build and render chart
  try {
    const chartBuilder = chart(data, spec.options || {});
    const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);

    // Render to container
    const renderOptions = {
      w: options.w || 800,
      h: options.h || 600,
      axes: options.axes || false,
      debug: options.debug || false,
    };

    node.render(container, renderOptions);
  } catch (error) {
    console.error(
      "[GoFish Derive] Error during chart building/rendering:",
      error
    );
    throw error;
  }
}

// Auto-render if chart data is in window
if (typeof window !== "undefined") {
  const tryRender = () => {
    if (window.gofishChartSpec) {
      const { spec, arrowData, options, containerId } = window.gofishChartSpec;
      const targetContainerId = containerId || "chart-container";

      try {
        renderChart(spec, arrowData, options, targetContainerId);
      } catch (error) {
        console.error("[GoFish Derive] Error rendering chart:", error);
        const container = document.getElementById(targetContainerId);
        if (container) {
          container.innerHTML = `<div style="color: red; padding: 20px;">
            <strong>Error rendering chart:</strong><br/>
            ${error.message}<br/>
            <pre>${error.stack}</pre>
          </div>`;
        }
      }
    }
  };

  // Try immediately if DOM is already loaded
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", tryRender);
  } else {
    tryRender();
  }

  // Also expose renderChart globally for manual calling
  window.renderChart = renderChart;
}
