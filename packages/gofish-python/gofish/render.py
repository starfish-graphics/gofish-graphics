"""Rendering utilities for displaying GoFish charts."""

import os
import sys
from typing import Any, Dict, List, Optional

from .bridge import render_chart
from .arrow_utils import dataframe_to_arrow


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
    
    # Render chart via Node.js bridge (all operators, including derive, are passed through)
    html = render_chart(
        current_data,
        operators,
        mark,
        options,
        arrow_data=arrow_data,
    )
    
    # Display or save
    if _is_jupyter():
        # Display in Jupyter - use IFrame with data URI to allow JavaScript execution
        # Jupyter sanitizes HTML and removes script tags, so we use an iframe
        try:
            from IPython.display import IFrame
            import base64
            
            # Use data URI to embed HTML directly
            # Base64 encode the HTML
            html_b64 = base64.b64encode(html.encode('utf-8')).decode('ascii')
            data_uri = f"data:text/html;base64,{html_b64}"
            
            # Use IFrame with data URI
            # This avoids the warning and allows JavaScript to execute
            return IFrame(src=data_uri, width='100%', height=600)
        except Exception as e:
            # Fallback: try using HTML with srcdoc if IFrame doesn't work
            try:
                from IPython.display import HTML
                # Escape HTML for srcdoc attribute
                escaped_html = html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#39;')
                iframe_html = f"""<iframe 
srcdoc="{escaped_html}" 
style="width: 100%; min-height: 600px; border: none;"
sandbox="allow-scripts allow-same-origin"
></iframe>"""
                return HTML(iframe_html)
            except ImportError:
                # Final fallback: print HTML (won't render but shows structure)
                print(f"Error displaying chart: {e}")
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


