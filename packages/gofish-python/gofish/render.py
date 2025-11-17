"""Rendering utilities for displaying GoFish charts."""

import os
import sys
from typing import Any, Dict, List, Optional

from .bridge import render_chart
from .arrow_utils import dataframe_to_arrow
from .operators import DeriveOperator


def _is_jupyter() -> bool:
    """Check if we're running in a Jupyter notebook."""
    try:
        from IPython import get_ipython
        ipython = get_ipython()
        if ipython is None:
            return False
        # Check if it's a Jupyter kernel
        return ipython.__class__.__name__ in [
            "ZMQInteractiveShell",
            "TerminalInteractiveShell",
        ]
    except ImportError:
        return False


def render_chart_spec(
    data: Any,
    operators: List[Any],
    mark: Any,
    options: Dict[str, Any],
    filename: Optional[str] = None,
) -> Any:
    """
    Render a chart specification.

    Args:
        data: Input data (DataFrame)
        operators: List of operators
        mark: Mark object
        options: Render options
        filename: Optional filename to save HTML

    Returns:
        Display object (for Jupyter) or None
    """
    import pandas as pd
    
    # Convert initial data to Arrow (derive operators will be handled in JS pipeline)
    current_data = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    arrow_data = dataframe_to_arrow(current_data)
    
    # Display or save
    if _is_jupyter():
        # Use AnyWidget for Jupyter rendering
        from .widget import GoFishChartWidget
        
        # Collect derive functions from operators
        derive_functions = {}
        for op in operators:
            if isinstance(op, DeriveOperator):
                derive_functions[op.lambda_id] = op.fn
        
        # Serialize spec
        spec = {
            "data": None,  # Data will come via Arrow
            "operators": [op.to_dict() for op in operators],
            "mark": mark.to_dict(),
            "options": {},
        }
        
        # Create and return widget
        widget = GoFishChartWidget(
            spec=spec,
            arrow_data=arrow_data,
            derive_functions=derive_functions,
            width=options.get("w", 800),
            height=options.get("h", 600),
            axes=options.get("axes", False),
            debug=options.get("debug", False),
        )
        return widget
    else:
        # Standalone mode - use HTML rendering
        html = render_chart(
            current_data,
            operators,
            mark,
            options,
            arrow_data=arrow_data,
        )
        
        if filename:
            with open(filename, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"Chart saved to {filename}")
            
            # Try to open in browser
            try:
                import webbrowser
                file_url = f"file://{os.path.abspath(filename)}"
                webbrowser.open(file_url)
            except Exception:
                pass  # Ignore browser opening errors
        else:
            # Save to temp file and open
            import tempfile
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".html",
                delete=False,
                encoding="utf-8",
            ) as f:
                f.write(html)
                temp_filename = f.name
            
            print(f"Chart rendered to temporary file: {temp_filename}")
            
            # Try to open in browser
            try:
                import webbrowser
                file_url = f"file://{os.path.abspath(temp_filename)}"
                webbrowser.open(file_url)
            except Exception:
                pass  # Ignore browser opening errors
        
        return None


