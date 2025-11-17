"""AnyWidget-based chart rendering for GoFish."""

import base64
import json
import uuid
from pathlib import Path
from typing import Any, Callable, Dict, Optional

import anywidget
import traitlets

from .arrow_utils import dataframe_to_arrow, arrow_to_dataframe
from .bridge import find_client_bundle, ensure_js_dependencies


class GoFishChartWidget(anywidget.AnyWidget):
    """Widget for rendering GoFish charts with derive operator support."""

    # Traitlets for chart configuration
    spec = traitlets.Dict().tag(sync=True)
    arrow_data = traitlets.Unicode().tag(sync=True)  # Base64-encoded Arrow data
    derive_functions = traitlets.Dict().tag(sync=False)  # Not synced - Python only
    width = traitlets.Int(800).tag(sync=True)
    height = traitlets.Int(600).tag(sync=True)
    axes = traitlets.Bool(False).tag(sync=True)
    debug = traitlets.Bool(False).tag(sync=True)
    container_id = traitlets.Unicode().tag(sync=True)
    
    # Placeholder _esm - will be set in __init__
    _esm = ""

    def __init__(
        self,
        spec: Dict[str, Any],
        arrow_data: bytes,
        derive_functions: Dict[str, Callable],
        width: int = 800,
        height: int = 600,
        axes: bool = False,
        debug: bool = False,
        **kwargs
    ):
        """Initialize the GoFish chart widget.

        Args:
            spec: Chart specification (operators, mark, options)
            arrow_data: Initial data as Arrow bytes
            derive_functions: Map of lambda_id -> function reference
            width: Chart width
            height: Chart height
            axes: Whether to show axes
            debug: Whether to enable debug mode
            **kwargs: Additional widget arguments
        """
        # Generate unique container ID
        container_id = f"gofish-chart-{uuid.uuid4().hex[:8]}"
        
        # Store derive functions (not synced to frontend)
        self.derive_functions = derive_functions or {}
        
        # Ensure JS bundle is built
        ensure_js_dependencies()
        bundle_path = find_client_bundle()
        
        # Read the ESM bundle content to inline it as a data URL
        # This allows us to load it without needing a server
        # Prefer ESM format for anywidget
        esm_bundle_path = bundle_path.parent / "gofish-client.js"
        if esm_bundle_path.exists():
            bundle_path = esm_bundle_path
        
        with open(bundle_path, 'r', encoding='utf-8') as f:
            bundle_content = f.read()
        
        # Create a data URL for the bundle
        bundle_data_url = f"data:text/javascript;base64,{base64.b64encode(bundle_content.encode('utf-8')).decode('utf-8')}"
        
        # Create ESM module with full chart rendering
        esm_code = """
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
                  'No suitable Arrow serialization method found: ' + e.message
                );
              }
            } catch (e2) {
              throw new Error(
                'Unable to serialize Arrow table: ' + e.message + ', ' + e2.message
              );
            }
          }

          if (buffer instanceof Uint8Array) {
            return buffer;
          }
          return new Uint8Array(buffer);
        }

        // Execute derive function via model
        async function executeDeriveViaModel(model, lambdaId, data) {
          console.log("[GoFish Widget] executeDeriveViaModel called for lambdaId:", lambdaId);
          // Convert data array to Arrow
          const arrowBuffer = arrayToArrow(data);
          console.log("[GoFish Widget] Data converted to Arrow buffer length:", arrowBuffer.length);
          
          // Convert to base64 for transmission
          const arrowB64 = btoa(String.fromCharCode(...arrowBuffer));
          console.log("[GoFish Widget] Arrow buffer converted to base64 length:", arrowB64.length);
          
          // Call Python method via model
          const resultB64 = await model.get('executeDerive')(lambdaId, arrowB64);
          console.log("[GoFish Widget] Python executeDerive returned result length:", resultB64.length);
          
          // Convert result back to array
          const resultBuffer = Uint8Array.from(atob(resultB64), (c) =>
            c.charCodeAt(0)
          );
          const resultTable = Arrow.tableFromIPC(resultBuffer);
          const resultArray = arrowTableToArray(resultTable);
          console.log("[GoFish Widget] Result converted back to array length:", resultArray.length);
          return resultArray;
        }

        // Main render function
        function renderChart(model, GoFish, Arrow, createResource) {
          console.log("[GoFish Widget] ===== renderChart() called =====");
          const containerId = model.get('container_id');
          console.log("[GoFish Widget] Looking for container:", containerId);
          const container = document.getElementById(containerId);
          if (!container) {
            console.error("[GoFish Widget] Container not found:", containerId);
            throw new Error('Container with id "' + containerId + '" not found');
          }
          console.log("[GoFish Widget] Container found:", container);

          // Deserialize Arrow data
          let data;
          const arrowDataB64 = model.get('arrow_data');
          console.log("[GoFish Widget] Arrow data (base64) length:", arrowDataB64?.length);
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
          const spec = model.get('spec');
          console.log("[GoFish Widget] Spec:", spec);
          console.log("[GoFish Widget] Operators:", spec.operators);
          const reconstructedOps = [];

          for (const op of spec.operators || []) {
            console.log("[GoFish Widget] Processing operator:", op.type, op);
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
                const dataKey = JSON.stringify(d);

                const [result] = createResource(
                  () => {
                    return [lambdaId, dataKey];
                  },
                  async ([id, key]) => {
                    return await executeDeriveViaModel(model, id, d);
                  }
                );

                // Return resource accessor function
                return () => {
                  const value = result();
                  return value;
                };
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
            throw new Error('Unknown mark type: ' + markSpec.type);
          }

          // Build and render chart
          console.log("[GoFish Widget] Building chart...");
          console.log("[GoFish Widget] Reconstructed ops count:", reconstructedOps.length);
          console.log("[GoFish Widget] Reconstructed mark:", reconstructedMark);
          try {
            const chartBuilder = chart(data, spec.options || {});
            console.log("[GoFish Widget] Chart builder created");
            const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);
            console.log("[GoFish Widget] Chart node created");

            // Render to container
            const renderOptions = {
              w: model.get('width'),
              h: model.get('height'),
              axes: model.get('axes'),
              debug: model.get('debug'),
            };
            console.log("[GoFish Widget] Render options:", renderOptions);
            console.log("[GoFish Widget] Calling node.render()...");
            node.render(container, renderOptions);
            console.log("[GoFish Widget] Chart rendered successfully!");
          } catch (error) {
            console.error("[GoFish Widget] Error during chart building/rendering:", error);
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
            const containerId = model.get('container_id');
            console.log("[GoFish Widget] Container ID:", containerId);
            el.innerHTML = '<div id="' + containerId + '"><div style="padding: 20px; border: 2px solid blue;">Loading chart...</div></div>';
            console.log("[GoFish Widget] Container div created");
            
            // Load the bundled client code as ESM module
            try {
              console.log("[GoFish Widget] Loading bundled client code as ESM...");
              
              // Import the bundle as an ESM module
              const bundleUrl = """ + json.dumps(bundle_data_url) + """;
              const bundleModule = await import(bundleUrl);
              
              console.log("[GoFish Widget] Bundle loaded successfully");
              console.log("[GoFish Widget] Bundle exports:", Object.keys(bundleModule));
              
              // Extract modules from bundle
              const gofishModule = bundleModule.GoFish;
              const arrowModule = bundleModule.Arrow;
              const solidModule = { createResource: bundleModule.createResource };
              
              if (!gofishModule || !arrowModule || !solidModule) {
                const missing = [];
                if (!gofishModule) missing.push("gofish-graphics");
                if (!arrowModule) missing.push("apache-arrow");
                if (!solidModule) missing.push("solid-js");
                const errorMsg = "Missing: " + missing.join(", ");
                el.innerHTML = '<div style="color: red; padding: 20px; border: 2px solid red; background: #ffe0e0;">' +
                  '<h2>GoFish Widget Error</h2>' +
                  '<p><strong>Failed to load required dependencies:</strong></p>' +
                  '<pre style="background: #fff; padding: 10px; overflow: auto;">' + errorMsg + '</pre>' +
                  '<p>The widget needs these npm packages to be available.</p>' +
                  '</div>';
                console.error("[GoFish Widget] Import check failed:", errorMsg);
                return;
              }
              
              console.log("[GoFish Widget] All imports available");
              
              // Render the chart
              try {
                renderChart(model, gofishModule, arrowModule, solidModule.createResource);
              } catch (error) {
                console.error("[GoFish Widget] Error rendering chart:", error);
                const errorHtml = '<div style="color: red; padding: 20px; border: 2px solid red;">' +
                  '<strong>Error rendering chart:</strong><br/>' +
                  error.message + '<br/>' +
                  '<pre style="background: #fff; padding: 10px; overflow: auto;">' + (error.stack || '') + '</pre>' +
                  '</div>';
                el.innerHTML = errorHtml;
                // Also update container if it exists
                const container = document.getElementById(containerId);
                if (container) {
                  container.innerHTML = errorHtml;
                }
              }
            } catch (error) {
              el.innerHTML = '<div style="color: red; padding: 20px; border: 2px solid red;">' +
                '<h2>GoFish Widget Error</h2>' +
                '<p>Error loading dependencies: ' + error.message + '</p>' +
                '</div>';
              console.error("[GoFish Widget] Import error:", error);
            }
            console.log("[GoFish Widget] ===== render() completed =====");
          }
        };
        """
        
        # Combine bundle JS with our wrapper
        # Note: We need to include the bundle JS, but anywidget's _esm expects ESM format
        # For now, we'll use the inline ESM code above that imports from gofish-graphics
        # The bundle will be loaded separately or we can inline it
        
        arrow_data_b64 = base64.b64encode(arrow_data).decode('utf-8')
        print(f"[GoFish Widget] Arrow data base64 length: {len(arrow_data_b64)}")
        print(f"[GoFish Widget] Initializing widget with traitlets...")
        
        super().__init__(
            _esm=esm_code,
            spec=spec,
            arrow_data=arrow_data_b64,
            width=width,
            height=height,
            axes=axes,
            debug=debug,
            container_id=container_id,
            **kwargs
        )
        print(f"[GoFish Widget] Widget initialized successfully")
    
    @traitlets.default('executeDerive')
    def _execute_derive(self):
        """Execute a derive function and return result as base64 Arrow data."""
        def execute(lambda_id: str, arrow_data_b64: str) -> str:
            """Execute derive function.
            
            Args:
                lambda_id: ID of the derive function
                arrow_data_b64: Input data as base64-encoded Arrow bytes
                
            Returns:
                Result as base64-encoded Arrow bytes
            """
            print(f"[GoFish Widget] executeDerive called with lambda_id: {lambda_id}")
            print(f"[GoFish Widget] Arrow data length: {len(arrow_data_b64)}")
            print(f"[GoFish Widget] Available derive functions: {list(self.derive_functions.keys())}")
            
            # Get function from registry
            fn = self.derive_functions.get(lambda_id)
            if fn is None:
                error_msg = f"Derive function with ID {lambda_id} not found"
                print(f"[GoFish Widget] ERROR: {error_msg}")
                raise ValueError(error_msg)
            
            print(f"[GoFish Widget] Function found, executing...")
            # Decode Arrow data
            arrow_bytes = base64.b64decode(arrow_data_b64)
            print(f"[GoFish Widget] Decoded Arrow bytes length: {len(arrow_bytes)}")
            df = arrow_to_dataframe(arrow_bytes)
            print(f"[GoFish Widget] DataFrame shape: {df.shape}, columns: {list(df.columns)}")
            
            # Execute function
            result_df = fn(df)
            print(f"[GoFish Widget] Function executed, result shape: {result_df.shape}")
            
            # Convert result back to Arrow
            result_arrow = dataframe_to_arrow(result_df)
            result_b64 = base64.b64encode(result_arrow).decode('utf-8')
            print(f"[GoFish Widget] Result encoded, length: {len(result_b64)}")
            
            return result_b64
        
        return execute

