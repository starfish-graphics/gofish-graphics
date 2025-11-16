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
    Supports bidirectional communication for derive operators.

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
    
    # Execute Node.js script with bidirectional communication
    try:
        process = subprocess.Popen(
            [node_cmd, str(render_js)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,  # Use text mode for line-based protocol
            bufsize=1,  # Line buffered
        )
        
        # Send initial input (JSON on a single line)
        input_json = json.dumps(input_data)
        process.stdin.write(input_json + "\n")
        process.stdin.flush()
        
        # Read responses line by line
        final_output = None
        while True:
            line = process.stdout.readline()
            if not line:
                break
            
            line = line.strip()
            if not line:
                continue
            
            try:
                message = json.loads(line)
                
                # Check if it's a derive execution request
                if message.get("type") == "derive_execute":
                    # Handle derive request
                    lambda_id = message.get("lambdaId")
                    arrow_data_b64 = message.get("arrowData")
                    
                    if not lambda_id or not arrow_data_b64:
                        response = {
                            "type": "error",
                            "error": "Missing lambdaId or arrowData in derive_execute request"
                        }
                        process.stdin.write(json.dumps(response) + "\n")
                        process.stdin.flush()
                        continue
                    
                    # Get lambda from registry
                    fn = get_lambda(lambda_id)
                    if fn is None:
                        response = {
                            "type": "error",
                            "error": f"Lambda with ID {lambda_id} not found in registry"
                        }
                        process.stdin.write(json.dumps(response) + "\n")
                        process.stdin.flush()
                        continue
                    
                    try:
                        # Convert Arrow to DataFrame
                        arrow_bytes = base64.b64decode(arrow_data_b64)
                        df = arrow_to_dataframe(arrow_bytes)
                        
                        # Debug: Print DataFrame information
                        print(f"[DEBUG] Executing derive lambda {lambda_id}")
                        print(f"[DEBUG] DataFrame shape: {df.shape}")
                        print(f"[DEBUG] DataFrame columns: {list(df.columns)}")
                        print(f"[DEBUG] DataFrame dtypes:\n{df.dtypes}")
                        print(f"[DEBUG] DataFrame head:\n{df.head()}")
                        buf = io.StringIO()
                        df.info(buf=buf)
                        print(f"[DEBUG] DataFrame info:\n{buf.getvalue()}")
                        
                        # Execute lambda
                        result_df = fn(df)
                        
                        # Debug: Print result DataFrame information
                        print(f"[DEBUG] Result DataFrame shape: {result_df.shape}")
                        print(f"[DEBUG] Result DataFrame columns: {list(result_df.columns)}")
                        print(f"[DEBUG] Result DataFrame head:\n{result_df.head()}")
                        
                        # Convert result back to Arrow
                        result_arrow = dataframe_to_arrow(result_df)
                        result_b64 = base64.b64encode(result_arrow).decode("utf-8")
                        
                        # Send response
                        response = {
                            "type": "response",
                            "arrowData": result_b64
                        }
                        process.stdin.write(json.dumps(response) + "\n")
                        process.stdin.flush()
                        
                    except Exception as e:
                        # Send error response
                        response = {
                            "type": "error",
                            "error": str(e)
                        }
                        process.stdin.write(json.dumps(response) + "\n")
                        process.stdin.flush()
                
                # Check if it's the final output
                elif "success" in message:
                    final_output = message
                    break
                
                # Unknown message type - ignore or log
                else:
                    # Might be final output in different format
                    if "html" in message:
                        final_output = message
                        break
                        
            except json.JSONDecodeError:
                # Not JSON, might be error output
                continue
        
        # Wait for process to finish
        process.wait()
        
        if process.returncode != 0:
            stderr_output = process.stderr.read() if process.stderr else "Unknown error"
            raise RuntimeError(f"Node.js rendering failed: {stderr_output}")
        
        if final_output is None:
            raise RuntimeError("No output received from Node.js process")
        
        if not final_output.get("success"):
            error_msg = final_output.get("error", "Unknown error")
            raise RuntimeError(f"Rendering failed: {error_msg}")
        
        return final_output["html"]
        
    except subprocess.TimeoutExpired:
        process.kill()
        raise RuntimeError("Rendering timed out after 30 seconds")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Node.js output: {e}")
    except Exception as e:
        raise RuntimeError(f"Failed to render chart: {e}") from e


