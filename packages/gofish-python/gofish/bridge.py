"""Bridge for communicating with Node.js to render GoFish charts."""

import json
import os
import subprocess
import sys
import tempfile
import base64
from pathlib import Path
from typing import Any, Dict, List, Optional

from .arrow_utils import dataframe_to_arrow


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
    
    # Check if node_modules exists
    if not node_modules.exists() or not any(node_modules.iterdir()):
        # Try to install dependencies
        node_cmd = find_node_executable()
        try:
            subprocess.run(
                [node_cmd, "npm", "install"],
                cwd=js_dir,
                check=True,
                capture_output=True,
                timeout=300,  # 5 minutes timeout
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(
                f"Failed to install Node.js dependencies: {e.stderr.decode()}"
            ) from e
        except subprocess.TimeoutExpired:
            raise RuntimeError(
                "Timeout while installing Node.js dependencies. "
                "Please run 'npm install' manually in the js/ directory."
            )


def render_chart(
    data: Any,
    operators: List[Any],
    mark: Any,
    options: Dict[str, Any],
    arrow_data: Optional[bytes] = None,
) -> str:
    """
    Render a GoFish chart by communicating with Node.js.

    Args:
        data: Input data (DataFrame, will be converted to Arrow if needed)
        operators: List of operators
        mark: Mark object
        options: Render options (w, h, axes, debug)
        arrow_data: Pre-serialized Arrow data (optional)

    Returns:
        HTML string

    Raises:
        RuntimeError: If Node.js is not available or rendering fails
    """
    # Ensure dependencies are installed
    ensure_js_dependencies()
    
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
    
    # Encode Arrow data as base64 for JSON transmission
    arrow_b64 = base64.b64encode(arrow_data).decode("utf-8")
    
    # Prepare input
    input_data = {
        "spec": spec,
        "arrowData": arrow_b64,
        "options": options,
    }
    
    # Find Node.js and script
    node_cmd = find_node_executable()
    render_js = find_js_bridge_script()
    
    # Execute Node.js script
    try:
        process = subprocess.Popen(
            [node_cmd, str(render_js)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=False,  # Use binary mode
        )
        
        # Send input
        input_json = json.dumps(input_data)
        stdout, stderr = process.communicate(
            input=input_json.encode("utf-8"),
            timeout=30,  # 30 second timeout
        )
        
        if process.returncode != 0:
            error_msg = stderr.decode("utf-8") if stderr else "Unknown error"
            raise RuntimeError(f"Node.js rendering failed: {error_msg}")
        
        # Parse output
        output = json.loads(stdout.decode("utf-8"))
        
        if not output.get("success"):
            error_msg = output.get("error", "Unknown error")
            raise RuntimeError(f"Rendering failed: {error_msg}")
        
        return output["html"]
        
    except subprocess.TimeoutExpired:
        process.kill()
        raise RuntimeError("Rendering timed out after 30 seconds")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Node.js output: {e}")
    except Exception as e:
        raise RuntimeError(f"Failed to render chart: {e}") from e


