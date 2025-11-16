#!/usr/bin/env node

/**
 * Node.js bridge script for rendering GoFish charts.
 *
 * This script:
 * 1. Reads chart spec and Arrow data from stdin (JSON, line-based)
 * 2. Deserializes Arrow data
 * 3. Executes GoFish chart rendering with derive operator support
 * 4. Returns HTML string to stdout
 */

import { JSDOM } from "jsdom";
import * as Arrow from "apache-arrow";
import * as GoFish from "gofish-graphics";
import readline from "readline";

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

  // Use Arrow's tableFromJSON which should be available
  const table = Arrow.tableFromJSON(data);

  // Serialize to IPC stream format compatible with Python's pa.ipc.open_stream
  // Python uses pa.ipc.new_stream which creates a stream format
  // We need to use RecordBatchStreamWriter or similar
  let buffer;
  try {
    // Get batches from table
    const batches = table.batches;
    if (!batches || batches.length === 0) {
      throw new Error("Table has no batches");
    }

    // Create IPC stream writer
    const writer = Arrow.RecordBatchStreamWriter.writeAll(
      table.schema,
      batches
    );
    buffer = writer.finish();
  } catch (e) {
    // If that fails, try alternative methods
    try {
      // Try using tableToIPC if available
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

  // Ensure it's a Buffer
  if (buffer instanceof Uint8Array) {
    return Buffer.from(buffer);
  } else if (Buffer.isBuffer(buffer)) {
    return buffer;
  }
  return Buffer.from(buffer);
}

// Create readline interface for reading from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// Queue for pending line reads
const lineQueue = [];

// Set up line reader that processes queue
rl.on("line", (inputLine) => {
  const next = lineQueue.shift();
  if (next) {
    next.resolve(inputLine);
  }
});

rl.on("error", (err) => {
  const next = lineQueue.shift();
  if (next) {
    next.reject(err);
  }
});

// Helper function to read a line from stdin (using the shared readline interface)
function readLine() {
  return new Promise((resolve, reject) => {
    lineQueue.push({ resolve, reject });
  });
}

// Helper function to execute derive operator
async function executeDerive(data, lambdaId) {
  // Convert data array to Arrow
  let arrowBuffer;
  try {
    arrowBuffer = arrayToArrow(data);
  } catch (e) {
    throw new Error(`Failed to convert data to Arrow: ${e.message}`);
  }
  const arrowB64 = arrowBuffer.toString("base64");

  // Send request to Python
  const request = {
    type: "derive_execute",
    lambdaId: lambdaId,
    arrowData: arrowB64,
  };

  // Write request to stdout (which Python reads)
  process.stdout.write(JSON.stringify(request) + "\n");
  if (process.stdout.flush) {
    process.stdout.flush();
  }

  // Read response from stdin (which Python writes to)
  const responseLine = await readLine();

  try {
    const response = JSON.parse(responseLine);

    if (response.type === "error") {
      throw new Error(response.error);
    }

    if (response.type === "response" && response.arrowData) {
      // Convert Arrow back to array
      try {
        const arrowBuffer = Buffer.from(response.arrowData, "base64");
        const table = Arrow.tableFromIPC(arrowBuffer);
        const resultData = arrowTableToArray(table);
        return resultData;
      } catch (arrowError) {
        throw new Error(
          `Failed to parse Arrow response: ${arrowError.message}`
        );
      }
    } else {
      throw new Error("Invalid response from Python");
    }
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error(`Failed to parse response: ${e.message}`);
  }
}

// Read initial input from stdin (line-based)
(async () => {
  try {
    const inputLine = await readLine();
    const input = JSON.parse(inputLine);
    const { spec, arrowData, options } = input;

    // Create virtual DOM
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="chart-container"></div></body></html>',
      {
        url: "http://localhost",
        pretendToBeVisual: true,
        resources: "usable",
      }
    );

    const window = dom.window;
    const document = window.document;
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;

    // Deserialize Arrow data
    let data;
    if (arrowData) {
      const arrowBuffer = Buffer.from(arrowData, "base64");
      const table = Arrow.tableFromIPC(arrowBuffer);
      data = arrowTableToArray(table);
    } else {
      data = spec.data || [];
    }

    // Reconstruct chart from spec
    const container = document.getElementById("chart-container");

    // Build operators from spec
    const operators = spec.operators || [];

    // Build mark from spec
    const markSpec = spec.mark || {};

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

    for (const op of operators) {
      let reconstructedOp = null;

      if (op.type === "derive") {
        // Create derive operator that calls Python kernel
        const lambdaId = op.lambdaId;
        if (!lambdaId) {
          throw new Error("derive operator missing lambdaId");
        }
        // Create derive operator that calls Python kernel
        // The derive function will be called with data during pipeline execution
        // We need to handle async properly - create a derive that awaits executeDerive
        reconstructedOp = derive(async (d) => {
          return await executeDerive(d, lambdaId);
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

    // Wait a bit for SolidJS to render (hacky but necessary)
    setTimeout(() => {
      const html = container.innerHTML;
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; font-family: sans-serif; }
    svg { display: block; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

      process.stdout.write(
        JSON.stringify({ success: true, html: fullHtml }) + "\n"
      );
      rl.close();
      process.exit(0);
    }, 100);
  } catch (error) {
    process.stderr.write(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }) + "\n"
    );
    rl.close();
    process.exit(1);
  }
})();
