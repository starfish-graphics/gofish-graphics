// GoFish Widget ESM - Full chart rendering
console.log("[GoFish Widget] ESM module code loaded!");

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

// Main render function
function renderChart(model, GoFish, Arrow, createResource, createSignal) {
  console.log("[GoFish Widget] ===== renderChart() called =====");
  const containerId = model.get("container_id");
  console.log("[GoFish Widget] Looking for container:", containerId);
  const container = document.getElementById(containerId);
  if (!container) {
    console.error("[GoFish Widget] Container not found:", containerId);
    throw new Error('Container with id "' + containerId + '" not found');
  }
  console.log("[GoFish Widget] Container found:", container);

  // Deserialize Arrow data
  let data;
  const arrowDataB64 = model.get("arrow_data");
  console.log(
    "[GoFish Widget] Arrow data (base64) length:",
    arrowDataB64?.length
  );
  if (arrowDataB64) {
    try {
      console.log("[GoFish Widget] Decoding Arrow data...");
      const arrowBuffer = Uint8Array.from(atob(arrowDataB64), (c) =>
        c.charCodeAt(0)
      );
      console.log("[GoFish Widget] Arrow buffer length:", arrowBuffer.length);
      const table = Arrow.tableFromIPC(arrowBuffer);
      console.log("[GoFish Widget] Arrow table rows:", table.numRows);
      data = arrowTableToArray(table);
      console.log("[GoFish Widget] Data array length:", data.length);
    } catch (error) {
      console.error("[GoFish Widget] Error deserializing Arrow data:", error);
      throw error;
    }
  } else {
    console.log("[GoFish Widget] No Arrow data, using empty array");
    data = [];
  }

  // Import GoFish functions
  const {
    chart,
    spread,
    stack,
    group,
    scatter,
    derive,
    rect,
    circle,
    line,
    area,
    scaffold,
  } = GoFish;

  // Process operators and reconstruct them
  const spec = model.get("spec");
  console.log("[GoFish Widget] Spec:", spec);
  console.log("[GoFish Widget] Operators:", spec.operators);
  const reconstructedOps = [];

  for (const op of spec.operators || []) {
    console.log("[GoFish Widget] Processing operator:", op.type, op);
    let reconstructedOp = null;

    if (op.type === "derive") {
      console.log("[GoFish Widget] ===== Creating derive operator =====");
      console.log(
        "[GoFish Widget] About to call GoFish Graphics derive() function"
      );
      // Map derive to gofish JS derive with async identity function using createResource
      const deriveFn = (d) => {
        console.log("[GoFish Widget] ===== derive function EXECUTED =====");
        console.log("[GoFish Widget] derive called with data:", d);
        console.log(
          "[GoFish Widget] Data type:",
          typeof d,
          Array.isArray(d) ? `array of ${d.length} items` : ""
        );

        // Test signals
        const [testSignal, setTestSignal] = createSignal("initial value");
        console.log("[GoFish Widget] Signal initial value:", testSignal());
        setTestSignal("updated value");
        console.log("[GoFish Widget] Signal after update:", testSignal());

        // Create an async resource that returns the data
        const [result] = createResource(async () => {
          console.log("[GoFish Widget] createResource async function started");
          // Wait 1s before returning the data
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.log(
            "[GoFish Widget] createResource async function completed, returning data"
          );
          return d;
        });
        console.log(
          "[GoFish Widget] createResource result (immediate):",
          result()
        );
        setTimeout(() => {
          console.log(
            "[GoFish Widget] createResource timeout result (after 1s):",
            result()
          );
          return result();
        }, 1000);
        // Return the resource accessor
        // return /* () =>  */ result();
        console.log("[GoFish Widget] derive function returning data directly");
        return d;
      };
      console.log(
        "[GoFish Widget] Calling GoFish Graphics derive() with function"
      );
      reconstructedOp = derive(deriveFn);
      console.log("[GoFish Widget] ===== derive operator created =====");
      console.log(
        "[GoFish Widget] Note: GoFish Graphics derive() console.logs will appear in browser console"
      );
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
    throw new Error("Unknown mark type: " + markSpec.type);
  }

  // Build and render chart
  console.log("[GoFish Widget] Building chart...");
  console.log(
    "[GoFish Widget] Reconstructed ops count:",
    reconstructedOps.length
  );
  console.log("[GoFish Widget] Reconstructed mark:", reconstructedMark);
  try {
    const chartBuilder = chart(data, spec.options || {});
    console.log("[GoFish Widget] Chart builder created");
    const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);
    console.log("[GoFish Widget] Chart node created");

    // Render to container
    const renderOptions = {
      w: model.get("width"),
      h: model.get("height"),
      axes: model.get("axes"),
      debug: model.get("debug"),
    };
    console.log("[GoFish Widget] Render options:", renderOptions);
    console.log("[GoFish Widget] Calling node.render()...");
    node.render(container, renderOptions);
    console.log("[GoFish Widget] Chart rendered successfully!");
  } catch (error) {
    console.error(
      "[GoFish Widget] Error during chart building/rendering:",
      error
    );
    console.error("[GoFish Widget] Error stack:", error.stack);
    throw error;
  }
  console.log("[GoFish Widget] ===== renderChart() completed =====");
}

// Export render function for anywidget
export default {
  async render({ model, el }) {
    console.log("[GoFish Widget] ===== render() called =====");
    console.log("[GoFish Widget] Element:", el);
    console.log("[GoFish Widget] Model:", model);

    // Create container div
    const containerId = model.get("container_id");
    console.log("[GoFish Widget] Container ID:", containerId);
    el.innerHTML =
      '<div id="' +
      containerId +
      '"><div style="padding: 20px; border: 2px solid blue;">Loading chart...</div></div>';
    console.log("[GoFish Widget] Container div created");

    // Load the bundled client code as ESM module
    try {
      console.log("[GoFish Widget] Loading bundled client code as ESM...");

      // prettier-ignore
      {BUNDLE_IMPORT}

      // prettier-ignore
      {EXTRACT_MODULES}

      if (!gofishModule || !arrowModule || !createResource || !createSignal) {
        const missing = [];
        if (!gofishModule) missing.push("gofish-graphics");
        if (!arrowModule) missing.push("apache-arrow");
        if (!createResource) missing.push("solid-js (createResource)");
        if (!createSignal) missing.push("solid-js (createSignal)");
        const errorMsg = "Missing: " + missing.join(", ");
        el.innerHTML =
          '<div style="color: red; padding: 20px; border: 2px solid red; background: #ffe0e0;">' +
          "<h2>GoFish Widget Error</h2>" +
          "<p><strong>Failed to load required dependencies:</strong></p>" +
          '<pre style="background: #fff; padding: 10px; overflow: auto;">' +
          errorMsg +
          "</pre>" +
          "<p>The widget needs these npm packages to be available.</p>" +
          "</div>";
        console.error("[GoFish Widget] Import check failed:", errorMsg);
        return;
      }

      console.log("[GoFish Widget] All imports available");
      console.log(
        "[GoFish Widget] createResource available:",
        typeof createResource
      );
      console.log(
        "[GoFish Widget] createSignal available:",
        typeof createSignal
      );

      // Render the chart
      try {
        renderChart(
          model,
          gofishModule,
          arrowModule,
          createResource,
          createSignal
        );
      } catch (error) {
        console.error("[GoFish Widget] Error rendering chart:", error);
        const errorHtml =
          '<div style="color: red; padding: 20px; border: 2px solid red;">' +
          "<strong>Error rendering chart:</strong><br/>" +
          error.message +
          "<br/>" +
          '<pre style="background: #fff; padding: 10px; overflow: auto;">' +
          (error.stack || "") +
          "</pre>" +
          "</div>";
        el.innerHTML = errorHtml;
        // Also update container if it exists
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = errorHtml;
        }
      }
    } catch (error) {
      el.innerHTML =
        '<div style="color: red; padding: 20px; border: 2px solid red;">' +
        "<h2>GoFish Widget Error</h2>" +
        "<p>Error loading dependencies: " +
        error.message +
        "</p>" +
        "</div>";
      console.error("[GoFish Widget] Import error:", error);
    }
    console.log("[GoFish Widget] ===== render() completed =====");
  },
};
