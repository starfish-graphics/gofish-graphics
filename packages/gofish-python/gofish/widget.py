"""AnyWidget-based chart rendering for GoFish."""

import base64
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
        
        # Create ESM module that imports from gofish-graphics and provides model integration
        # Note: This assumes gofish-graphics is available as an npm package
        # In Jupyter, this will be bundled by anywidget
        esm_code = """
        import * as GoFish from "gofish-graphics";
        import * as Arrow from "apache-arrow";
        import {{ createResource }} from "solid-js";
        
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

        // Helper function to convert array to Arrow format
        function arrayToArrow(data) {{
          if (!data || data.length === 0) {{
            throw new Error("Cannot convert empty array to Arrow");
          }}

          const table = Arrow.tableFromJSON(data);

          // Serialize to IPC stream format
          let buffer;
          try {{
            const batches = table.batches;
            if (!batches || batches.length === 0) {{
              throw new Error("Table has no batches");
            }}

            const writer = Arrow.RecordBatchStreamWriter.writeAll(
              table.schema,
              batches
            );
            buffer = writer.finish();
          }} catch (e) {{
            try {{
              if (Arrow.tableToIPC) {{
                buffer = Arrow.tableToIPC(table);
              }} else if (Arrow.tableToIPCStreamWriter) {{
                const writer = Arrow.tableToIPCStreamWriter(table);
                buffer = writer.finish();
              }} else {{
                throw new Error(
                  'No suitable Arrow serialization method found: ' + e.message
                );
              }}
            }} catch (e2) {{
              throw new Error(
                'Unable to serialize Arrow table: ' + e.message + ', ' + e2.message
              );
            }}
          }}

          if (buffer instanceof Uint8Array) {{
            return buffer;
          }}
          return new Uint8Array(buffer);
        }}

        // Execute derive function via model
        async function executeDeriveViaModel(model, lambdaId, data) {{
          // Convert data array to Arrow
          const arrowBuffer = arrayToArrow(data);
          
          // Convert to base64 for transmission
          const arrowB64 = btoa(String.fromCharCode(...arrowBuffer));
          
          // Call Python method via model
          const resultB64 = await model.get('executeDerive')(lambdaId, arrowB64);
          
          // Convert result back to array
          const resultBuffer = Uint8Array.from(atob(resultB64), (c) =>
            c.charCodeAt(0)
          );
          const resultTable = Arrow.tableFromIPC(resultBuffer);
          return arrowTableToArray(resultTable);
        }}

        // Main render function
        function renderChart(model) {{
          const container = document.getElementById(model.get('container_id'));
          if (!container) {{
            throw new Error('Container with id "' + model.get('container_id') + '" not found');
          }}

          // Deserialize Arrow data
          let data;
          const arrowDataB64 = model.get('arrow_data');
          if (arrowDataB64) {{
            try {{
              const arrowBuffer = Uint8Array.from(atob(arrowDataB64), (c) =>
                c.charCodeAt(0)
              );
              const table = Arrow.tableFromIPC(arrowBuffer);
              data = arrowTableToArray(table);
            }} catch (error) {{
              console.error("[GoFish] Error deserializing Arrow data:", error);
              throw error;
            }}
          }} else {{
            data = [];
          }}

          // Import GoFish functions
          const {{
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
          }} = GoFish;

          // Process operators and reconstruct them
          const spec = model.get('spec');
          const reconstructedOps = [];

          for (const op of spec.operators || []) {{
            let reconstructedOp = null;

            if (op.type === "derive") {{
              // Create derive operator that uses createResource for async Python calls
              const lambdaId = op.lambdaId;
              if (!lambdaId) {{
                throw new Error("derive operator missing lambdaId");
              }}

              // Create derive that returns a resource accessor
              reconstructedOp = derive((d) => {{
                // Create resource for this derive operation
                const dataKey = JSON.stringify(d);

                const [result] = createResource(
                  () => {{
                    return [lambdaId, dataKey];
                  }},
                  async ([id, key]) => {{
                    return await executeDeriveViaModel(model, id, d);
                  }}
                );

                // Return resource accessor function
                return () => {{
                  const value = result();
                  return value;
                }};
              }});
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
          try {{
            const chartBuilder = chart(data, spec.options || {{}});
            const node = chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);

            // Render to container
            const renderOptions = {{
              w: model.get('width'),
              h: model.get('height'),
              axes: model.get('axes'),
              debug: model.get('debug'),
            }};

            node.render(container, renderOptions);
          }} catch (error) {{
            console.error("[GoFish] Error during chart building/rendering:", error);
            throw error;
          }}
        }}

        // Export render function for anywidget
        export default {{
          async render({{ model, el }}) {{
            // Create container div
            const containerId = model.get('container_id');
            el.innerHTML = '<div id="' + containerId + '"><div>Loading chart...</div></div>';
            
            // Wait for model to be ready, then render
            model.on('change:spec', () => {{
              try {{
                renderChart(model);
              }} catch (error) {{
                console.error("[GoFish] Error rendering chart:", error);
                el.innerHTML = '<div style="color: red; padding: 20px;">' +
                  '<strong>Error rendering chart:</strong><br/>' +
                  error.message + '<br/>' +
                  '<pre>' + (error.stack || '') + '</pre>' +
                  '</div>';
              }}
            }});
            
            // Initial render
            try {{
              renderChart(model);
            }} catch (error) {{
              console.error("[GoFish] Error rendering chart:", error);
              el.innerHTML = '<div style="color: red; padding: 20px;">' +
                '<strong>Error rendering chart:</strong><br/>' +
                error.message + '<br/>' +
                '<pre>' + (error.stack || '') + '</pre>' +
                '</div>';
            }}
          }}
        }};
        """
        
        # Combine bundle JS with our wrapper
        # Note: We need to include the bundle JS, but anywidget's _esm expects ESM format
        # For now, we'll use the inline ESM code above that imports from gofish-graphics
        # The bundle will be loaded separately or we can inline it
        
        super().__init__(
            _esm=esm_code,
            spec=spec,
            arrow_data=base64.b64encode(arrow_data).decode('utf-8'),
            width=width,
            height=height,
            axes=axes,
            debug=debug,
            container_id=container_id,
            **kwargs
        )
    
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
            # Get function from registry
            fn = self.derive_functions.get(lambda_id)
            if fn is None:
                raise ValueError(f"Derive function with ID {lambda_id} not found")
            
            # Decode Arrow data
            arrow_bytes = base64.b64decode(arrow_data_b64)
            df = arrow_to_dataframe(arrow_bytes)
            
            # Execute function
            result_df = fn(df)
            
            # Convert result back to Arrow
            result_arrow = dataframe_to_arrow(result_df)
            result_b64 = base64.b64encode(result_arrow).decode('utf-8')
            
            return result_b64
        
        return execute

