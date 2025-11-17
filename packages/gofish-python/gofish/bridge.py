"""Bridge for communicating with Node.js to render GoFish charts."""

import json
import os
import subprocess
import sys
import tempfile
import base64
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from .arrow_utils import dataframe_to_arrow, arrow_to_dataframe


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
    
    # For anywidget, prefer ESM format
    bundle_path = dist_dir / "gofish-client.js"  # ESM format
    
    # Fallback to IIFE if ESM doesn't exist
    if not bundle_path.exists():
        bundle_path = dist_dir / "gofish-client.iife.js"
    
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
    Note: For Jupyter, use the widget-based rendering in render.py instead.

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
    #derive-debug {{
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.95);
      color: #0f0;
      padding: 10px;
      font-size: 11px;
      font-family: monospace;
      max-width: 600px;
      max-height: 500px;
      overflow: auto;
      z-index: 10000;
      border: 2px solid #0f0;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0,255,0,0.5);
    }}
    #derive-debug-header {{
      background: #0f0;
      color: #000;
      padding: 5px;
      margin: -10px -10px 10px -10px;
      font-weight: bold;
      cursor: pointer;
    }}
    #derive-debug-content {{
      max-height: 450px;
      overflow-y: auto;
    }}
    #derive-debug-entry {{
      margin-bottom: 3px;
      padding: 2px 5px;
      border-left: 2px solid transparent;
      word-break: break-word;
    }}
    #derive-debug-entry.error {{
      color: #f00;
      border-left-color: #f00;
      background: rgba(255,0,0,0.1);
    }}
    #derive-debug-entry.log {{
      color: #0f0;
    }}
    #derive-debug-toggle {{
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
  <button id="derive-debug-toggle" onclick="document.getElementById('derive-debug').style.display = document.getElementById('derive-debug').style.display === 'none' ? 'block' : 'none';">🔍 Derive Debug</button>
  <div id="derive-debug" style="display: block;">
    <div id="derive-debug-header" onclick="this.parentElement.style.display='none';">GoFish Derive Debug Log (click to hide)</div>
    <div id="derive-debug-content"></div>
  </div>
  <div id="{container_id}">
    <div id="loading">Loading chart...</div>
  </div>
  <script>
    // Derive-specific debug logging
    const deriveDebugDiv = document.getElementById('derive-debug');
    const deriveDebugContent = document.getElementById('derive-debug-content');
    const originalLog = console.log;
    const originalError = console.error;
    
    function addDeriveDebugLog(level, ...args) {{
      // Only log messages related to derive
      const msg = args.map(a => {{
        // Handle Error objects specially to avoid SecurityError when serializing
        if (a instanceof Error) {{
          // For Error objects, only use safe properties
          const errorName = a.name || 'Error';
          const errorMessage = a.message || '';
          // Don't try to access stack or other properties that might reference window
          return `${{errorName}}: ${{errorMessage}}`;
        }}
        
        if (typeof a === 'object') {{
          try {{
            // Limit object serialization to prevent huge outputs
            const str = JSON.stringify(a, null, 2);
            // Truncate very long strings (like bundle code or large data)
            if (str.length > 10000) {{
              return str.substring(0, 10000) + '... (truncated, ' + (str.length - 10000) + ' more characters)';
            }}
            return str;
          }} catch (e) {{
            // If serialization fails (e.g., due to circular refs or SecurityError),
            // just use a safe string representation
            try {{
              const str = String(a);
              // Truncate string representations too
              if (str.length > 10000) {{
                return str.substring(0, 10000) + '... (truncated, ' + (str.length - 10000) + ' more characters)';
              }}
              return str;
            }} catch (e2) {{
              // Even String() can throw in some cases - use fallback
              return '[Object - cannot serialize]';
            }}
          }}
        }}
        const str = String(a);
        // Truncate very long strings
        if (str.length > 10000) {{
          return str.substring(0, 10000) + '... (truncated, ' + (str.length - 10000) + ' more characters)';
        }}
        return str;
      }}).join(' ');
      
      // Filter for derive-related messages - but exclude if it looks like bundle code
      // (bundle code might contain [GoFish Derive] but we don't want to log the entire bundle)
      if (!msg.includes('[GoFish Derive]')) {{
        return;
      }}
      
      // Skip if message is suspiciously long (likely bundle code or large data dump)
      // This prevents the "giant wall of characters" issue
      if (msg.length > 50000) {{
        console.warn('[GoFish Derive] Skipping extremely long message (' + msg.length + ' chars - likely bundle code or data dump)');
        return;
      }}
      
      const entry = document.createElement('div');
      entry.id = 'derive-debug-entry';
      entry.className = level;
      const timestamp = new Date().toLocaleTimeString();
      
      // Escape HTML to prevent rendering issues
      const escapedMsg = msg
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      
      entry.innerHTML = `<span style="color: #888;">[${{timestamp}}]</span> <span style="white-space: pre-wrap; word-break: break-word;">${{escapedMsg}}</span>`;
      deriveDebugContent.appendChild(entry);
      deriveDebugContent.scrollTop = deriveDebugContent.scrollHeight;
      
      // Keep only last 200 entries
      while (deriveDebugContent.children.length > 200) {{
        deriveDebugContent.removeChild(deriveDebugContent.firstChild);
      }}
    }}
    
    console.log = function(...args) {{
      originalLog.apply(console, args);
      addDeriveDebugLog('log', ...args);
    }};
    
    console.error = function(...args) {{
      originalError.apply(console, args);
      addDeriveDebugLog('error', ...args);
    }};
    
    // Make chart spec available to client renderer
    window.gofishChartSpec = {{
      spec: {json.dumps(spec)},
      arrowData: {json.dumps(arrow_b64)},
      options: {json.dumps(options)},
      containerId: {json.dumps(container_id)}
    }};
  </script>
  <script>
    try {{
      {bundle_js}
    }} catch (e) {{
      // Truncate error stack to prevent huge outputs
      let errorStack = e.stack || '';
      if (errorStack.length > 5000) {{
        errorStack = errorStack.substring(0, 5000) + '... (truncated)';
      }}
      console.error('[GoFish Derive] Error loading bundle:', e.message, errorStack.substring(0, 1000));
      const container = document.getElementById({json.dumps(container_id)});
      if (container) {{
        const safeMessage = (e.message || 'Unknown error').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeStack = errorStack.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        container.innerHTML = '<div style="color: red; padding: 20px;"><strong>Error loading bundle:</strong><br/>' + safeMessage + '<br/><pre style="max-height: 300px; overflow: auto;">' + safeStack + '</pre></div>';
      }}
    }}
  </script>
</body>
</html>"""
    
    return html


