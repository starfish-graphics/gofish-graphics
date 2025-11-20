"""AnyWidget-based chart rendering for GoFish."""

import base64
import json
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

import anywidget
import traitlets

from .arrow_utils import dataframe_to_arrow


def find_client_bundle() -> Optional[Path]:
    """
    Find the path to the pre-built client JavaScript bundle.
    
    First tries to find the bundle from gofish-python package,
    then falls back to None (will use CDN imports).
    
    Returns:
        Path to the bundle file (ESM format) or None if not found
    """
    # Try to find bundle from gofish-python package
    try:
        import gofish
        gofish_path = Path(gofish.__file__).parent
        js_dir = gofish_path / "js" / "dist"
        bundle_path = js_dir / "gofish-client.js"
        if bundle_path.exists():
            return bundle_path
    except (ImportError, AttributeError):
        pass
    
    return None


class GoFishChartWidget(anywidget.AnyWidget):
    """Widget for rendering GoFish charts from JSON specifications."""

    # Traitlets for chart configuration
    spec = traitlets.Dict().tag(sync=True)
    arrow_data = traitlets.Unicode().tag(sync=True)  # Base64-encoded Arrow data
    width = traitlets.Int(800).tag(sync=True)
    height = traitlets.Int(600).tag(sync=True)
    axes = traitlets.Bool(False).tag(sync=True)
    debug = traitlets.Bool(False).tag(sync=True)
    container_id = traitlets.Unicode().tag(sync=True)
    
    def __init__(
        self,
        spec: Dict[str, Any],
        arrow_data: bytes,
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
            width: Chart width
            height: Chart height
            axes: Whether to show axes
            debug: Whether to enable debug mode
            **kwargs: Additional widget arguments
        """
        # Generate unique container ID
        container_id = f"gofish-chart-{uuid.uuid4().hex[:8]}"
        
        # Check if we have a local bundle
        bundle_path = find_client_bundle()
        
        if bundle_path and bundle_path.exists():
            # Use local bundle
            with open(bundle_path, 'r', encoding='utf-8') as f:
                bundle_content = f.read()
            
            # Create a data URL for the bundle
            bundle_data_url = f"data:text/javascript;base64,{base64.b64encode(bundle_content.encode('utf-8')).decode('utf-8')}"
            bundle_import = f"const bundleModule = await import({json.dumps(bundle_data_url)});"
            extract_modules = """
              // Try to extract modules from bundle exports
              let gofishModule, arrowModule;
              if (bundleModule.GoFish) {
                gofishModule = bundleModule.GoFish;
              } else if (bundleModule.default && bundleModule.default.GoFish) {
                gofishModule = bundleModule.default.GoFish;
              } else {
                // Try to use bundleModule directly if it's the GoFish module
                gofishModule = bundleModule;
              }
              
              if (bundleModule.Arrow) {
                arrowModule = bundleModule.Arrow;
              } else if (bundleModule.default && bundleModule.default.Arrow) {
                arrowModule = bundleModule.default.Arrow;
              } else {
                // Fallback: try to import Arrow separately
                arrowModule = await import('https://cdn.jsdelivr.net/npm/apache-arrow@latest/+esm');
              }
              
              // Note: solid-js is not needed for gofish-python-2 since derive operators are not supported
            """
        else:
            # Use CDN imports (fallback)
            # Note: This may not work in all environments due to CORS/ESM restrictions
            # For production, users should build the bundle or install gofish-python
            # Note: gofish-graphics requires solid-js, but CDN ESM imports don't resolve bare specifiers
            # We'll use a workaround: try to use unpkg or skypack which handle dependencies better
            bundle_import = """
              // Try to use a CDN that handles ESM dependencies better
              // First, set up import map if not already present
              if (!document.querySelector('script[type="importmap"]')) {
                const importMap = document.createElement('script');
                importMap.type = 'importmap';
                importMap.textContent = JSON.stringify({
                  "imports": {
                    "solid-js": "https://esm.sh/solid-js@latest",
                    "apache-arrow": "https://esm.sh/apache-arrow@latest"
                  }
                });
                document.head.insertBefore(importMap, document.head.firstChild);
                // Wait for import map to be processed
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
              // Use esm.sh which handles ESM dependencies better
              const [gofishMod, arrowMod] = await Promise.all([
                import('https://esm.sh/gofish-graphics@latest'),
                import('https://esm.sh/apache-arrow@latest')
              ]);
            """
            extract_modules = """
              const gofishModule = gofishMod;
              const arrowModule = arrowMod;
            """
        
        # Create ESM module with full chart rendering
        esm_code = f"""
        // GoFish Widget ESM - Full chart rendering
        console.log("[GoFish Widget] ESM module code loaded!");
        
        // Helper function to convert Arrow table to array of objects
        function arrowTableToArray(table) {{
          const numRows = table.numRows;
          const columns = table.schema.fields.map((field, i) => {{
            const column = table.getChildAt(i);
            const values = column.toArray();
            return {{
              name: field.name,
              type: field.type,
              values: values,
            }};
          }});

          const data = [];
          for (let i = 0; i < numRows; i++) {{
            const row = {{}};
            columns.forEach((col) => {{
              let value = col.values[i];
              // Convert BigInt to Number if needed
              if (typeof value === "bigint") {{
                value = Number(value);
              }} else if (value !== null && value !== undefined) {{
                const typeStr = col.type ? col.type.toString() : "";
                if (
                  typeStr.includes("Int64") ||
                  typeStr.includes("UInt64") ||
                  typeStr.includes("Int32") ||
                  typeStr.includes("UInt32")
                ) {{
                  value = Number(value);
                }}
              }}
              row[col.name] = value;
            }});
            data.push(row);
          }}
          return data;
        }}

        // Main render function
        function renderChart(model, GoFish, Arrow) {{
          console.log("[GoFish Widget] ===== renderChart() called =====");
          const containerId = model.get('container_id');
          console.log("[GoFish Widget] Looking for container:", containerId);
          const container = document.getElementById(containerId);
          if (!container) {{
            console.error("[GoFish Widget] Container not found:", containerId);
            throw new Error('Container with id "' + containerId + '" not found');
          }}
          console.log("[GoFish Widget] Container found:", container);

          // Deserialize Arrow data
          let data;
          const arrowDataB64 = model.get('arrow_data');
          console.log("[GoFish Widget] Arrow data (base64) length:", arrowDataB64?.length);
          if (arrowDataB64) {{
            try {{
              console.log("[GoFish Widget] Decoding Arrow data...");
              const arrowBuffer = Uint8Array.from(atob(arrowDataB64), (c) =>
                c.charCodeAt(0)
              );
              console.log("[GoFish Widget] Arrow buffer length:", arrowBuffer.length);
              const table = Arrow.tableFromIPC(arrowBuffer);
              console.log("[GoFish Widget] Arrow table rows:", table.numRows);
              data = arrowTableToArray(table);
              console.log("[GoFish Widget] Data array length:", data.length);
            }} catch (error) {{
              console.error("[GoFish Widget] Error deserializing Arrow data:", error);
              throw error;
            }}
          }} else {{
            console.log("[GoFish Widget] No Arrow data, using empty array");
            data = [];
          }}

          // Import GoFish functions
          const {{
            chart,
            spread,
            stack,
            group,
            scatter,
            rect,
            circle,
            line,
            area,
            scaffold,
          }} = GoFish;

          // Process operators and reconstruct them
          const spec = model.get('spec');
          console.log("[GoFish Widget] Spec:", spec);
          console.log("[GoFish Widget] Operators:", spec.operators);
          const reconstructedOps = [];

          for (const op of spec.operators || []) {{
            console.log("[GoFish Widget] Processing operator:", op.type, op);
            let reconstructedOp = null;

            if (op.type === "derive") {{
              // Derive operators are not supported in gofish-python-2
              // They require Python function execution which is not implemented
              console.warn("[GoFish Widget] Derive operators are not supported in gofish-python-2. Skipping.");
              continue;
            }} else if (op.type === "spread") {{
              const {{ field, ...opts }} = op;
              if (field) {{
                reconstructedOp = spread(field, opts);
              }} else {{
                reconstructedOp = spread(opts);
              }}
            }} else if (op.type === "stack") {{
              const {{ field, dir, ...opts }} = op;
              reconstructedOp = stack(field, {{ dir, ...opts }});
            }} else if (op.type === "group") {{
              reconstructedOp = group(op.field);
            }} else if (op.type === "scatter") {{
              const {{ field, x, y, ...opts }} = op;
              reconstructedOp = scatter(field, {{ x, y, ...opts }});
            }}

            if (reconstructedOp) {{
              reconstructedOps.push(reconstructedOp);
            }}
          }}

          // Reconstruct mark
          let reconstructedMark;
          const markSpec = spec.mark || {{}};
          if (markSpec.type === "rect") {{
            reconstructedMark = rect(markSpec);
          }} else if (markSpec.type === "circle") {{
            reconstructedMark = circle(markSpec);
          }} else if (markSpec.type === "line") {{
            reconstructedMark = line(markSpec);
          }} else if (markSpec.type === "area") {{
            reconstructedMark = area(markSpec);
          }} else if (markSpec.type === "scaffold") {{
            reconstructedMark = scaffold(markSpec);
          }} else {{
            throw new Error('Unknown mark type: ' + markSpec.type);
          }}

          // Build and render chart
          console.log("[GoFish Widget] Building chart...");
          console.log("[GoFish Widget] Reconstructed ops count:", reconstructedOps.length);
          console.log("[GoFish Widget] Reconstructed mark:", reconstructedMark);
          try {{
            const chartBuilder = chart(data, spec.options || {{}});
            console.log("[GoFish Widget] Chart builder created");
            const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);
            console.log("[GoFish Widget] Chart node created");

            // Render to container
            const renderOptions = {{
              w: model.get('width'),
              h: model.get('height'),
              axes: model.get('axes'),
              debug: model.get('debug'),
            }};
            console.log("[GoFish Widget] Render options:", renderOptions);
            console.log("[GoFish Widget] Calling node.render()...");
            node.render(container, renderOptions);
            console.log("[GoFish Widget] Chart rendered successfully!");
          }} catch (error) {{
            console.error("[GoFish Widget] Error during chart building/rendering:", error);
            console.error("[GoFish Widget] Error stack:", error.stack);
            throw error;
          }}
          console.log("[GoFish Widget] ===== renderChart() completed =====");
        }}

        // Export render function for anywidget
        export default {{
          async render({{ model, el }}) {{
            console.log("[GoFish Widget] ===== render() called =====");
            console.log("[GoFish Widget] Element:", el);
            console.log("[GoFish Widget] Model:", model);
            
            // Create container div
            const containerId = model.get('container_id');
            console.log("[GoFish Widget] Container ID:", containerId);
            el.innerHTML = '<div id="' + containerId + '"><div style="padding: 20px; border: 2px solid blue;">Loading chart...</div></div>';
            console.log("[GoFish Widget] Container div created");
            
            // Load the bundled client code as ESM module
            try {{
              console.log("[GoFish Widget] Loading bundled client code as ESM...");
              
              {bundle_import}
              
              {extract_modules}
              
              if (!gofishModule || !arrowModule) {{
                const missing = [];
                if (!gofishModule) missing.push("gofish-graphics");
                if (!arrowModule) missing.push("apache-arrow");
                const errorMsg = "Missing: " + missing.join(", ");
                el.innerHTML = '<div style="color: red; padding: 20px; border: 2px solid red; background: #ffe0e0;">' +
                  '<h2>GoFish Widget Error</h2>' +
                  '<p><strong>Failed to load required dependencies:</strong></p>' +
                  '<pre style="background: #fff; padding: 10px; overflow: auto;">' + errorMsg + '</pre>' +
                  '<p>The widget needs these npm packages to be available.</p>' +
                  '</div>';
                console.error("[GoFish Widget] Import check failed:", errorMsg);
                return;
              }}
              
              console.log("[GoFish Widget] All imports available");
              
              // Render the chart
              try {{
                renderChart(model, gofishModule, arrowModule);
              }} catch (error) {{
                console.error("[GoFish Widget] Error rendering chart:", error);
                const errorHtml = '<div style="color: red; padding: 20px; border: 2px solid red;">' +
                  '<strong>Error rendering chart:</strong><br/>' +
                  error.message + '<br/>' +
                  '<pre style="background: #fff; padding: 10px; overflow: auto;">' + (error.stack || '') + '</pre>' +
                  '</div>';
                el.innerHTML = errorHtml;
                // Also update container if it exists
                const container = document.getElementById(containerId);
                if (container) {{
                  container.innerHTML = errorHtml;
                }}
              }}
            }} catch (error) {{
              el.innerHTML = '<div style="color: red; padding: 20px; border: 2px solid red;">' +
                '<h2>GoFish Widget Error</h2>' +
                '<p>Error loading dependencies: ' + error.message + '</p>' +
                '</div>';
              console.error("[GoFish Widget] Import error:", error);
            }}
            console.log("[GoFish Widget] ===== render() completed =====");
          }}
        }};
        """
        
        arrow_data_b64 = base64.b64encode(arrow_data).decode('utf-8')
        
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

