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
    
    # Process derive operators - execute Python functions
    current_data = data.copy() if isinstance(data, pd.DataFrame) else pd.DataFrame(data)
    arrow_data = None
    
    # Apply derive operators in sequence
    for op in operators:
        if isinstance(op, DeriveOperator):
            # Execute Python function
            current_data = op.execute(current_data)
            # Convert to Arrow after transformation
            arrow_data = dataframe_to_arrow(current_data)
    
    # If no derive operators were applied, convert initial data
    if arrow_data is None:
        arrow_data = dataframe_to_arrow(current_data)
    
    # Render chart via Node.js bridge
    html = render_chart(
        current_data,
        operators,
        mark,
        options,
        arrow_data=arrow_data,
    )
    
    # Display or save
    if _is_jupyter():
        # Display in Jupyter
        try:
            from IPython.display import HTML, display
            display(HTML(html))
            return HTML(html)
        except ImportError:
            # Fallback: print HTML (won't render but shows structure)
            print(html)
            return None
    else:
        # Standalone mode
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


