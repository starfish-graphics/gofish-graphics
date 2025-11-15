"""
Utility functions for data conversion between Python and JavaScript.

Since JavaScript is the source of truth, we need to convert Python data
types to JavaScript equivalents for the GoFish API.
"""

from typing import Any, Dict, List, Union
import json

try:
    import numpy as np
    import pandas as pd
    HAS_NUMPY = True
    HAS_PANDAS = True
except ImportError:
    HAS_NUMPY = False
    HAS_PANDAS = False


def to_js(value: Any) -> Any:
    """
    Convert Python value to JavaScript-compatible value.
    
    Handles:
    - dict -> Object
    - list -> Array
    - numpy arrays -> TypedArray
    - pandas DataFrame -> Array of objects
    - Basic types (str, int, float, bool, None)
    """
    if value is None:
        return None
    
    if isinstance(value, (str, int, float, bool)):
        return value
    
    if isinstance(value, dict):
        return {k: to_js(v) for k, v in value.items()}
    
    if isinstance(value, (list, tuple)):
        return [to_js(item) for item in value]
    
    if HAS_NUMPY and isinstance(value, np.ndarray):
        # Convert numpy array to list (JS bridge will handle TypedArray)
        return value.tolist()
    
    if HAS_PANDAS and isinstance(value, pd.DataFrame):
        # Convert DataFrame to list of dicts
        return value.to_dict("records")
    
    if HAS_PANDAS and isinstance(value, pd.Series):
        return value.tolist()
    
    # For other types, try JSON serialization
    try:
        json_str = json.dumps(value, default=str)
        return json.loads(json_str)
    except (TypeError, ValueError):
        # Fallback: return string representation
        return str(value)


def from_js(value: Any) -> Any:
    """
    Convert JavaScript value to Python value.
    
    This is mainly for retrieving data back from JavaScript,
    though most interaction flows Python -> JS.
    """
    # Most JS types map directly to Python types
    # This is a placeholder for future bidirectional conversion
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    
    if isinstance(value, dict):
        return {k: from_js(v) for k, v in value.items()}
    
    if isinstance(value, (list, tuple)):
        return [from_js(item) for item in value]
    
    return value


def convert_options(options: Union[Dict[str, Any], None]) -> Dict[str, Any]:
    """
    Convert Python-style options dict to JavaScript-compatible format.
    
    Handles conversion of:
    - Python keyword arguments style (snake_case)
    - Direct value passing
    """
    if options is None:
        return {}
    
    converted = {}
    for key, value in options.items():
        # Convert snake_case to camelCase for JS compatibility if needed
        # For now, keep keys as-is since GoFish uses camelCase in JS
        converted[key] = to_js(value)
    
    return converted


def ensure_list(data: Any) -> List[Any]:
    """Ensure data is a list for JS processing."""
    if isinstance(data, (list, tuple)):
        return list(data)
    if HAS_PANDAS and isinstance(data, pd.DataFrame):
        return data.to_dict("records")
    if isinstance(data, dict):
        return [data]  # Single dict -> list with one item
    return [data]  # Wrap single value
