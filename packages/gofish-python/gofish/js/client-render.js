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

// Communication interface for Python
class PythonComm {
  constructor() {
    this.comm = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.isJupyter = false;
    this.init();
  }

  init() {
    // Check if we're in Jupyter
    if (typeof window !== "undefined" && window.Jupyter) {
      this.isJupyter = true;
      this.initJupyter();
    } else {
      // Standalone mode - would need WebSocket server
      // For now, we'll throw an error if not in Jupyter
      console.warn("Not in Jupyter - WebSocket support not yet implemented");
    }
  }

  initJupyter() {
    // Initialize Jupyter comms
    // The comm will be created by Python side
    // We'll listen for messages on a global channel
    if (
      typeof window !== "undefined" &&
      window.Jupyter &&
      window.Jupyter.notebook
    ) {
      // Jupyter notebook environment
      this.setupJupyterComms();
    } else if (
      typeof window !== "undefined" &&
      window.parent &&
      window.parent.postMessage
    ) {
      // JupyterLab or other iframe-based environment
      this.setupJupyterLabComms();
    }
  }

  setupJupyterComms() {
    // In Jupyter, we need to create a comm to communicate with Python
    // The Python side has registered a comm target "gofish_derive"
    if (
      window.Jupyter &&
      window.Jupyter.notebook &&
      window.Jupyter.notebook.kernel
    ) {
      // For Jupyter notebook classic
      const kernel = window.Jupyter.notebook.kernel;

      // Create a comm to the Python target
      this.comm = kernel.comm_manager.new_comm("gofish_derive", {});

      // Listen for messages
      this.comm.on_msg((msg) => {
        this.handleMessage(msg.content.data);
      });
    } else if (
      window.Jupyter &&
      window.Jupyter.notebook &&
      window.Jupyter.notebook.kernel &&
      window.Jupyter.notebook.kernel.comm_manager
    ) {
      // Alternative Jupyter setup
      const comm_manager = window.Jupyter.notebook.kernel.comm_manager;
      this.comm = comm_manager.new_comm("gofish_derive", {});

      this.comm.on_msg((msg) => {
        this.handleMessage(msg.content.data);
      });
    }
  }

  setupJupyterLabComms() {
    // For JupyterLab, we need to use the JupyterLab comm API
    // This requires the @jupyter-widgets/base package
    if (window.require) {
      // Try to use require.js to load JupyterLab comms
      window.require(["@jupyter-widgets/base"], (widgets) => {
        const comm_manager = widgets.shims.services.contents;
        // For JupyterLab, comms work differently
        // We'll use a global callback approach
        window.gofishCommHandler = (data) => {
          this.handleMessage(data);
        };
      });
    }

    // Also listen for postMessage as fallback
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "gofish_derive_response") {
        this.handleMessage(event.data);
      }
    });
  }

  handleMessage(data) {
    const { requestId, type, arrowData, error } = data;

    if (type === "response" && requestId !== undefined) {
      const resolve = this.pendingRequests.get(requestId);
      if (resolve) {
        this.pendingRequests.delete(requestId);

        if (error) {
          resolve.reject(new Error(error));
        } else {
          // Convert Arrow data back to array
          try {
            const arrowBuffer = Uint8Array.from(atob(arrowData), (c) =>
              c.charCodeAt(0)
            );
            const table = Arrow.tableFromIPC(arrowBuffer);
            const resultData = arrowTableToArray(table);
            resolve.resolve(resultData);
          } catch (e) {
            resolve.reject(
              new Error(`Failed to parse Arrow response: ${e.message}`)
            );
          }
        }
      }
    }
  }

  async executeDerive(data, lambdaId) {
    // Convert data array to Arrow
    let arrowBuffer;
    try {
      arrowBuffer = arrayToArrow(data);
    } catch (e) {
      throw new Error(`Failed to convert data to Arrow: ${e.message}`);
    }

    // Convert to base64 for transmission
    const arrowB64 = btoa(String.fromCharCode(...arrowBuffer));

    // Generate request ID
    const requestId = this.requestId++;

    // Create promise for response
    const promise = new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error("Derive request timed out"));
        }
      }, 30000); // 30 second timeout
    });

    // Send request
    const request = {
      type: "derive_execute",
      requestId: requestId,
      lambdaId: lambdaId,
      arrowData: arrowB64,
    };

    if (this.isJupyter && this.comm) {
      // Send via Jupyter comm
      this.comm.send(request);
    } else if (this.isJupyter && window.gofishCommHandler) {
      // Use global handler if available (JupyterLab)
      // This would need to be set up by Python side
      window.gofishCommHandler(request);
    } else if (this.isJupyter && window.parent) {
      // Send via postMessage for JupyterLab fallback
      window.parent.postMessage(
        {
          type: "gofish_derive_request",
          ...request,
        },
        "*"
      );
    } else {
      throw new Error(
        "No communication channel available. Make sure you're running in Jupyter."
      );
    }

    return promise;
  }
}

// Global comm instance
let pythonComm = null;

function getPythonComm() {
  if (!pythonComm) {
    pythonComm = new PythonComm();
  }
  return pythonComm;
}

// Main render function
export function renderChart(spec, arrowData, options, containerId) {
  console.log("[GoFish] renderChart called with:", {
    spec,
    arrowData: arrowData ? `${arrowData.length} chars` : null,
    options,
    containerId,
  });

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[GoFish] Container with id "${containerId}" not found`);
    throw new Error(`Container with id "${containerId}" not found`);
  }

  console.log("[GoFish] Container found:", container);

  // Deserialize Arrow data
  let data;
  if (arrowData) {
    console.log("[GoFish] Deserializing Arrow data, length:", arrowData.length);
    try {
      const arrowBuffer = Uint8Array.from(atob(arrowData), (c) =>
        c.charCodeAt(0)
      );
      console.log("[GoFish] Arrow buffer created, length:", arrowBuffer.length);
      const table = Arrow.tableFromIPC(arrowBuffer);
      console.log("[GoFish] Arrow table created, rows:", table.numRows);
      data = arrowTableToArray(table);
      console.log("[GoFish] Data array created, length:", data.length);
    } catch (error) {
      console.error("[GoFish] Error deserializing Arrow data:", error);
      throw error;
    }
  } else {
    data = spec.data || [];
    console.log("[GoFish] Using spec.data, length:", data.length);
  }

  // Import GoFish functions
  console.log("[GoFish] Importing GoFish functions");
  console.log("[GoFish] GoFish object:", GoFish);
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
  console.log("[GoFish] GoFish functions imported:", {
    chart: !!chart,
    spread: !!spread,
    stack: !!stack,
    derive: !!derive,
    rect: !!rect,
  });

  // Process operators and reconstruct them
  const reconstructedOps = [];

  for (const op of spec.operators || []) {
    let reconstructedOp = null;

    if (op.type === "derive") {
      // Create derive operator that uses createResource for async Python calls
      const lambdaId = op.lambdaId;
      if (!lambdaId) {
        throw new Error("derive operator missing lambdaId");
      }

      // Create derive that returns a resource accessor
      reconstructedOp = derive((d) => {
        // Create resource for this derive operation
        // The key is based on data content to ensure proper caching
        const dataKey = JSON.stringify(d);
        const [result] = createResource(
          () => [lambdaId, dataKey],
          async ([id, key]) => {
            const comm = getPythonComm();
            return await comm.executeDerive(d, id);
          }
        );

        // Return resource accessor function
        // When called during rendering, result() will automatically suspend if loading
        return () => result();
      });
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
  console.log("[GoFish] Building chart with data length:", data.length);
  console.log(
    "[GoFish] Reconstructed operators count:",
    reconstructedOps.length
  );
  console.log("[GoFish] Reconstructed mark:", reconstructedMark);

  try {
    const chartBuilder = chart(data, spec.options || {});
    console.log("[GoFish] Chart builder created");

    const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);
    console.log("[GoFish] Chart node created");

    // Render to container
    const renderOptions = {
      w: options.w || 800,
      h: options.h || 600,
      axes: options.axes || false,
      debug: options.debug || false,
    };

    console.log("[GoFish] Rendering with options:", renderOptions);
    node.render(container, renderOptions);
    console.log("[GoFish] Render call completed");
  } catch (error) {
    console.error("[GoFish] Error during chart building/rendering:", error);
    console.error("[GoFish] Error stack:", error.stack);
    throw error;
  }
}

// Auto-render if chart data is in window
if (typeof window !== "undefined") {
  console.log("[GoFish] Client renderer loaded");

  const tryRender = () => {
    console.log("[GoFish] Attempting to render chart");
    console.log("[GoFish] window.gofishChartSpec:", window.gofishChartSpec);

    if (window.gofishChartSpec) {
      const { spec, arrowData, options, containerId } = window.gofishChartSpec;
      const targetContainerId = containerId || "chart-container";
      console.log("[GoFish] Rendering chart to container:", targetContainerId);
      console.log("[GoFish] Spec:", spec);
      console.log("[GoFish] Options:", options);
      console.log(
        "[GoFish] Arrow data length:",
        arrowData ? arrowData.length : 0
      );

      try {
        renderChart(spec, arrowData, options, targetContainerId);
        console.log("[GoFish] Chart rendered successfully");
      } catch (error) {
        console.error("[GoFish] Error rendering chart:", error);
        console.error("[GoFish] Error stack:", error.stack);
        const container = document.getElementById(targetContainerId);
        if (container) {
          container.innerHTML = `<div style="color: red; padding: 20px;">
            <strong>Error rendering chart:</strong><br/>
            ${error.message}<br/>
            <pre>${error.stack}</pre>
          </div>`;
        }
      }
    } else {
      console.log("[GoFish] window.gofishChartSpec not found, waiting...");
    }
  };

  // Try immediately if DOM is already loaded
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", tryRender);
  } else {
    // DOM already loaded, try immediately
    tryRender();
  }

  // Also expose renderChart globally for manual calling
  window.renderChart = renderChart;
  console.log("[GoFish] renderChart function exposed on window");
}
