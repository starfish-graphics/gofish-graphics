"""Bridge for communicating with Node.js to render GoFish charts."""

import json
import os
import subprocess
import sys
import tempfile
import base64
import uuid
import threading
import io
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .arrow_utils import dataframe_to_arrow, arrow_to_dataframe


# Global lambda registry for storing derive functions by ID
_lambda_registry: Dict[str, Callable] = {}
_registry_lock = threading.Lock()


def register_lambda(fn: Callable) -> str:
    """
    Register a lambda function and return its unique ID.
    
    Args:
        fn: The lambda function to register
        
    Returns:
        Unique ID string for the lambda
    """
    lambda_id = str(uuid.uuid4())
    with _registry_lock:
        _lambda_registry[lambda_id] = fn
    return lambda_id


def get_lambda(lambda_id: str) -> Optional[Callable]:
    """
    Retrieve a lambda function by ID.
    
    Args:
        lambda_id: The unique ID of the lambda
        
    Returns:
        The lambda function, or None if not found
    """
    with _registry_lock:
        return _lambda_registry.get(lambda_id)


def find_js_bridge_script() -> Path:
    """Find the path to the Node.js render script."""
    # Get the directory where this Python module is located
    current_file = Path(__file__).resolve()
    package_dir = current_file.parent
    js_dir = package_dir / "js"
    render_js = js_dir / "render.js"
    
    if not render_js.exists():
        raise FileNotFoundError(
            f"Could not find render.js at {render_js}. "
            "Make sure the js/ directory exists and contains render.js"
        )
    
    return render_js


def find_node_executable() -> str:
    """Find the Node.js executable."""
    # Try common locations
    node_candidates = ["node", "nodejs"]
    
    for node_cmd in node_candidates:
        try:
            result = subprocess.run(
                [node_cmd, "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                return node_cmd
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    raise RuntimeError(
        "Node.js not found. Please install Node.js (https://nodejs.org/) "
        "and make sure it's in your PATH."
    )


def ensure_js_dependencies() -> None:
    """Ensure Node.js dependencies are installed."""
    js_dir = find_js_bridge_script().parent
    package_json = js_dir / "package.json"
    node_modules = js_dir / "node_modules"
    
    if not package_json.exists():
        raise FileNotFoundError(
            f"Could not find package.json at {package_json}"
        )
    
    # Check if node_modules exists and if vite-plugin-solid is installed
    vite_plugin_installed = (
        node_modules.exists() and 
        (node_modules / "vite-plugin-solid").exists()
    )
    
    if not node_modules.exists() or not any(node_modules.iterdir()) or not vite_plugin_installed:
        # Try to install dependencies (including devDependencies)
        npm_cmd = find_npm_executable()
        try:
            result = subprocess.run(
                [npm_cmd, "install"],
                cwd=js_dir,
                check=True,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minutes timeout
            )
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else e.stdout if e.stdout else "Unknown error"
            raise RuntimeError(
                f"Failed to install Node.js dependencies: {error_msg}"
            ) from e
        except subprocess.TimeoutExpired:
            raise RuntimeError(
                "Timeout while installing Node.js dependencies. "
                "Please run 'npm install' manually in the js/ directory."
            )


def find_npm_executable() -> str:
    """Find the npm executable."""
    # Try common locations
    npm_candidates = ["npm", "npm.cmd"]  # .cmd for Windows
    
    for npm_cmd in npm_candidates:
        try:
            result = subprocess.run(
                [npm_cmd, "--version"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                return npm_cmd
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    raise RuntimeError(
        "npm not found. Please install Node.js (https://nodejs.org/) "
        "which includes npm, and make sure it's in your PATH."
    )


def ensure_gofish_graphics_built() -> None:
    """Ensure gofish-graphics is built before bundling."""
    current_file = Path(__file__).resolve()
    # current_file is at packages/gofish-python/gofish/bridge.py
    # So we need to go: gofish -> gofish-python -> packages -> packages/gofish-graphics
    gofish_graphics_dir = current_file.parent.parent.parent / "gofish-graphics"
    dist_file = gofish_graphics_dir / "dist" / "index.js"
    
    if not dist_file.exists():
        # Try to build gofish-graphics
        npm_cmd = find_npm_executable()
        try:
            result = subprocess.run(
                [npm_cmd, "run", "build"],
                cwd=gofish_graphics_dir,
                check=True,
                capture_output=True,
                text=True,
                timeout=300,
            )
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else e.stdout if e.stdout else "Unknown error"
            raise RuntimeError(
                f"gofish-graphics is not built. Failed to build: {error_msg}\n"
                f"Please run 'npm run build' (or 'pnpm run build') in {gofish_graphics_dir}"
            ) from e
        except subprocess.TimeoutExpired:
            raise RuntimeError(
                f"Timeout while building gofish-graphics. "
                f"Please run 'npm run build' manually in {gofish_graphics_dir}"
            )


def find_client_bundle() -> Path:
    """Find the path to the bundled client JavaScript."""
    current_file = Path(__file__).resolve()
    package_dir = current_file.parent
    js_dir = package_dir / "js"
    dist_dir = js_dir / "dist"
    
    # Vite generates gofish-client.iife.js when using iife format
    bundle_path = dist_dir / "gofish-client.iife.js"
    
    # Also check for the non-iife version in case config changes
    if not bundle_path.exists():
        bundle_path = dist_dir / "gofish-client.js"
    
    if not bundle_path.exists():
        # Ensure gofish-graphics is built first
        ensure_gofish_graphics_built()
        
        # Try to build the client bundle
        ensure_js_dependencies()
        npm_cmd = find_npm_executable()
        try:
            result = subprocess.run(
                [npm_cmd, "run", "build:client"],
                cwd=js_dir,
                check=True,
                capture_output=True,
                text=True,
                timeout=300,
            )
            # Check for the actual file that was generated
            # Vite generates gofish-client.iife.js when using iife format
            bundle_path = dist_dir / "gofish-client.iife.js"
            if not bundle_path.exists():
                bundle_path = dist_dir / "gofish-client.js"
            
            # Verify the file was created
            if not bundle_path.exists():
                # List what files were actually created
                dist_files = list(dist_dir.glob("gofish-client*")) if dist_dir.exists() else []
                raise RuntimeError(
                    f"Build completed but bundle file not found. "
                    f"Expected: gofish-client.iife.js or gofish-client.js. "
                    f"Found in dist: {[f.name for f in dist_files]}. "
                    f"Build output: {result.stdout}"
                )
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else e.stdout if e.stdout else "Unknown error"
            raise RuntimeError(
                f"Failed to build client bundle: {error_msg}\n"
                f"Please run 'npm run build:client' manually in {js_dir}"
            ) from e
        except subprocess.TimeoutExpired:
            raise RuntimeError(
                "Timeout while building client bundle. "
                f"Please run 'npm run build:client' manually in {js_dir}"
            )
    
    return bundle_path


def setup_jupyter_comm():
    """Set up Jupyter comm for browser-Python communication."""
    try:
        from IPython import get_ipython
        ipython = get_ipython()
        if ipython is None:
            return False
        
        # Register comm target
        def handle_comm(comm, msg):
            """Handle messages from browser."""
            @comm.on_msg
            def _recv(msg):
                data = msg['content']['data']
                if data.get('type') == 'derive_execute':
                    lambda_id = data.get('lambdaId')
                    arrow_data_b64 = data.get('arrowData')
                    request_id = data.get('requestId')
                    
                    if not lambda_id or not arrow_data_b64:
                        comm.send({
                            'type': 'response',
                            'requestId': request_id,
                            'error': 'Missing lambdaId or arrowData'
                        })
                        return
                    
                    # Get lambda from registry
                    fn = get_lambda(lambda_id)
                    if fn is None:
                        comm.send({
                            'type': 'response',
                            'requestId': request_id,
                            'error': f'Lambda with ID {lambda_id} not found in registry'
                        })
                        return
                    
                    try:
                        # Convert Arrow to DataFrame
                        arrow_bytes = base64.b64decode(arrow_data_b64)
                        df = arrow_to_dataframe(arrow_bytes)
                        
                        # Execute lambda
                        result_df = fn(df)
                        
                        # Convert result back to Arrow
                        result_arrow = dataframe_to_arrow(result_df)
                        result_b64 = base64.b64encode(result_arrow).decode('utf-8')
                        
                        # Send response
                        comm.send({
                            'type': 'response',
                            'requestId': request_id,
                            'arrowData': result_b64
                        })
                    except Exception as e:
                        comm.send({
                            'type': 'response',
                            'requestId': request_id,
                            'error': str(e)
                        })
        
        # Register comm target - this will be called when browser creates a comm
        ipython.kernel.comm_manager.register_target('gofish_derive', handle_comm)
        return True
    except Exception as e:
        # Not in Jupyter or comm setup failed
        import traceback
        print(f"[DEBUG] Failed to setup Jupyter comm: {e}")
        print(traceback.format_exc())
        return False


def render_chart(
    data: Any,
    operators: List[Any],
    mark: Any,
    options: Dict[str, Any],
    arrow_data: Optional[bytes] = None,
) -> str:
    """
    Render a GoFish chart using client-side rendering.
    Generates HTML with bundled JavaScript that renders in the browser.
    Supports bidirectional communication for derive operators via Jupyter comms.

    Args:
        data: Input data (DataFrame, will be converted to Arrow if needed)
        operators: List of operators
        mark: Mark object
        options: Render options (w, h, axes, debug)
        arrow_data: Pre-serialized Arrow data (optional)

    Returns:
        HTML string

    Raises:
        RuntimeError: If bundle cannot be built or rendering fails
    """
    # Ensure dependencies are installed and bundle is built
    ensure_js_dependencies()
    bundle_path = find_client_bundle()
    
    # Set up Jupyter comm if in Jupyter
    setup_jupyter_comm()
    
    # Convert data to Arrow if not already provided
    if arrow_data is None:
        import pandas as pd
        if isinstance(data, pd.DataFrame):
            arrow_data = dataframe_to_arrow(data)
        else:
            # Try to convert to DataFrame
            data = pd.DataFrame(data)
            arrow_data = dataframe_to_arrow(data)
    
    # Serialize spec
    spec = {
        "data": None,  # Data will come via Arrow
        "operators": [op.to_dict() for op in operators],
        "mark": mark.to_dict(),
        "options": {},
    }
    
    # Encode Arrow data as base64 for embedding in HTML
    arrow_b64 = base64.b64encode(arrow_data).decode("utf-8")
    
    # Read bundled JavaScript
    with open(bundle_path, 'r', encoding='utf-8') as f:
        bundle_js = f.read()
    
    # Generate unique container ID
    container_id = f"gofish-chart-{uuid.uuid4().hex[:8]}"
    
    # Generate HTML
    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{
      margin: 0;
      padding: 20px;
      font-family: sans-serif;
    }}
    svg {{
      display: block;
    }}
    #loading {{
      text-align: center;
      padding: 20px;
      color: #666;
    }}
    #debug {{
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.9);
      color: #0f0;
      padding: 10px;
      font-size: 11px;
      font-family: monospace;
      max-width: 500px;
      max-height: 400px;
      overflow: auto;
      z-index: 10000;
      border: 2px solid #0f0;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0,255,0,0.5);
    }}
    #debug-header {{
      background: #0f0;
      color: #000;
      padding: 5px;
      margin: -10px -10px 10px -10px;
      font-weight: bold;
      cursor: pointer;
    }}
    #debug-content {{
      max-height: 350px;
      overflow-y: auto;
    }}
    #debug-entry {{
      margin-bottom: 3px;
      padding: 2px 5px;
      border-left: 2px solid transparent;
    }}
    #debug-entry.error {{
      color: #f00;
      border-left-color: #f00;
      background: rgba(255,0,0,0.1);
    }}
    #debug-entry.log {{
      color: #0f0;
    }}
    #debug-toggle {{
      position: fixed;
      top: 10px;
      right: 10px;
      background: #0f0;
      color: #000;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
      z-index: 10001;
      font-weight: bold;
      border-radius: 3px;
    }}
  </style>
</head>
<body>
  <button id="debug-toggle" onclick="document.getElementById('debug').style.display = document.getElementById('debug').style.display === 'none' ? 'block' : 'none';">🔍 Debug</button>
  <div id="debug" style="display: block;">
    <div id="debug-header" onclick="this.parentElement.style.display='none';">GoFish Debug Log (click to hide)</div>
    <div id="debug-content">
      <div id="debug-entry" class="log">[Initializing...]</div>
    </div>
  </div>
  <div id="{container_id}">
    <div id="loading">Loading chart... <span id="js-test" style="color: red; font-weight: bold;">(JS not running)</span></div>
  </div>
  <script>
    // Debug logging
    const debugDiv = document.getElementById('debug');
    const debugContent = document.getElementById('debug-content');
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    function addDebugLog(level, ...args) {{
      const msg = args.map(a => {{
        if (typeof a === 'object') {{
          try {{
            return JSON.stringify(a, null, 2);
          }} catch (e) {{
            return String(a);
          }}
        }}
        return String(a);
      }}).join(' ');
      
      const entry = document.createElement('div');
      entry.id = 'debug-entry';
      entry.className = level;
      const timestamp = new Date().toLocaleTimeString();
      entry.textContent = `[${{timestamp}}] [${{level.toUpperCase()}}] ${{msg}}`;
      debugContent.appendChild(entry);
      debugContent.scrollTop = debugContent.scrollHeight;
      
      // Keep only last 100 entries
      while (debugContent.children.length > 100) {{
        debugContent.removeChild(debugContent.firstChild);
      }}
    }}
    
    console.log = function(...args) {{
      originalLog.apply(console, args);
      addDebugLog('log', ...args);
    }};
    
    console.error = function(...args) {{
      originalError.apply(console, args);
      addDebugLog('error', ...args);
    }};
    
    console.warn = function(...args) {{
      originalWarn.apply(console, args);
      addDebugLog('warn', ...args);
    }};
    
    // Immediate test - is JavaScript running at all?
    const jsTest = document.getElementById('js-test');
    if (jsTest) {{
      jsTest.textContent = '(JS IS RUNNING!)';
      jsTest.style.color = 'green';
    }}
    
    console.log('[GoFish] ===== SCRIPT STARTING =====');
    console.log('[GoFish] Document ready state:', document.readyState);
    console.log('[GoFish] Window object exists:', typeof window !== 'undefined');
    
    // Make chart spec available to client renderer
    console.log('[GoFish] Setting up chart spec');
    window.gofishChartSpec = {{
      spec: {json.dumps(spec)},
      arrowData: {json.dumps(arrow_b64)},
      options: {json.dumps(options)},
      containerId: {json.dumps(container_id)}
    }};
    console.log('[GoFish] Chart spec set, containerId:', {json.dumps(container_id)});
    console.log('[GoFish] Spec operators count:', {len(spec.get('operators', []))});
    console.log('[GoFish] Arrow data length:', {len(arrow_b64)});
    console.log('[GoFish] Container element exists:', !!document.getElementById({json.dumps(container_id)}));
    
    // Try to remove loading message after a delay
    setTimeout(function() {{
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {{
        console.log('[GoFish] Removing loading message');
        loadingEl.textContent = 'JavaScript is running but chart not rendered yet...';
      }}
    }}, 1000);
  </script>
  <script>
    console.log('[GoFish] ===== LOADING BUNDLE SCRIPT =====');
    console.log('[GoFish] Bundle script length:', {len(bundle_js)});
    try {{
      {bundle_js}
      console.log('[GoFish] ===== BUNDLE SCRIPT LOADED =====');
      console.log('[GoFish] window.renderChart exists:', typeof window.renderChart !== 'undefined');
      console.log('[GoFish] window.gofishChartSpec exists:', typeof window.gofishChartSpec !== 'undefined');
      
      // Force immediate render attempt
      setTimeout(function() {{
        console.log('[GoFish] ===== FORCING RENDER ATTEMPT =====');
        if (window.renderChart && window.gofishChartSpec) {{
          console.log('[GoFish] Calling renderChart directly...');
          try {{
            const {{ spec, arrowData, options, containerId }} = window.gofishChartSpec;
            window.renderChart(spec, arrowData, options, containerId);
          }} catch (e) {{
            console.error('[GoFish] Error in forced render:', e);
          }}
        }} else {{
          console.error('[GoFish] Cannot render - renderChart:', typeof window.renderChart, 'spec:', typeof window.gofishChartSpec);
        }}
      }}, 100);
    }} catch (e) {{
      console.error('[GoFish] ===== ERROR LOADING BUNDLE =====');
      console.error('[GoFish] Error:', e);
      console.error('[GoFish] Error message:', e.message);
      console.error('[GoFish] Error stack:', e.stack);
      const container = document.getElementById({json.dumps(container_id)});
      if (container) {{
        container.innerHTML = '<div style="color: red; padding: 20px;"><strong>Error loading bundle:</strong><br/>' + e.message + '<br/><pre>' + e.stack + '</pre></div>';
      }}
    }}
  </script>
</body>
</html>"""
    
    return html


