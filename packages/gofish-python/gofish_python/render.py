"""
Rendering functions for GoFish Python.

Handles rendering charts to different outputs (Jupyter, HTML, etc.).
JavaScript is the source of truth - all rendering happens in JS using SolidJS.
"""

from typing import Optional, Any
import uuid
from .node import GoFishNode
from .utils import convert_options, to_js


def render(node: GoFishNode,
           container_id: Optional[str] = None,
           container: Any = None,
           w: Optional[int] = None,
           h: Optional[int] = None,
           x: Optional[int] = None,
           y: Optional[int] = None,
           axes: bool = False,
           debug: bool = False,
           **kwargs) -> Any:
    """
    Render a GoFishNode to a container.
    
    Args:
        node: GoFishNode to render
        container_id: HTML element ID (for web/Jupyter)
        container: Direct container element (alternative to container_id)
        w: Width
        h: Height
        axes: Show axes
        debug: Enable debug mode
        **kwargs: Additional options (transform, defs)
    
    Returns:
        Container element or HTML string (for Jupyter)
    
    Example:
        >>> node.render("my-chart", w=500, h=300, axes=True)
    """
    # Check if we're in Jupyter
    try:
        from IPython import get_ipython
        ipython = get_ipython()
        in_jupyter = ipython is not None
    except ImportError:
        in_jupyter = False
    
    # Build render options
    options = {"w": w, "h": h, "x": x, "y": y, "axes": axes, "debug": debug}
    options.update(kwargs)
    options = {k: v for k, v in options.items() if v is not None}
    
    # For Jupyter, generate HTML and display it
    if in_jupyter and container_id is None and container is None:
        return display_jupyter(node, **options)
    
    # For web/Jupyter with container_id, create container and render
    if container_id:
        return _render_to_container_id(node, container_id, options)
    
    # For direct container, render to it
    if container:
        js_options = convert_options(options)
        return node._js_node.render(container, js_options)
    
    # Default: generate HTML
    return display_html(node, **options)


def display_html(node: GoFishNode,
                 w: int = 500,
                 h: int = 300,
                 axes: bool = False,
                 debug: bool = False,
                 **kwargs) -> str:
    """
    Generate HTML string for the chart.
    
    Args:
        node: GoFishNode to render
        w: Width
        h: Height
        axes: Show axes
        debug: Enable debug mode
        **kwargs: Additional options
    
    Returns:
        HTML string with embedded chart
    
    Example:
        >>> html = display_html(node, w=500, h=300)
    """
    container_id = f"gofish-{uuid.uuid4().hex[:8]}"
    
    # Get JS runtime
    from .js_bridge import get_js_bridge
    js_bridge = get_js_bridge()
    gofish = js_bridge.gofish
    
    # Build options
    options = {"w": w, "h": h, "axes": axes, "debug": debug}
    options.update(kwargs)
    js_options = convert_options(options)
    
    # Generate HTML with embedded script
    html = f"""<div id="{container_id}" style="width: {w}px; height: {h}px;"></div>
<script>
// This requires the GoFish JS bundle to be loaded
// In a real implementation, we'd load it via script tag or bundle
(function() {{
    const container = document.getElementById('{container_id}');
    // Render chart (this would call the JS gofish function)
    // For now, this is a placeholder
    console.log('Rendering GoFish chart to', container);
}})();
</script>"""
    
    # TODO: Actually render to HTML string
    # This requires capturing SVG output from JS rendering
    return html


def display_jupyter(node: GoFishNode,
                    w: int = 500,
                    h: int = 300,
                    axes: bool = False,
                    debug: bool = False,
                    **kwargs) -> Any:
    """
    Display chart in Jupyter notebook.
    
    Args:
        node: GoFishNode to render
        w: Width
        h: Height
        axes: Show axes
        debug: Enable debug mode
        **kwargs: Additional options
    
    Returns:
        IPython display object
    
    Example:
        >>> display_jupyter(node, w=500, h=300)
    """
    try:
        from IPython.display import HTML, display
    except ImportError:
        raise ImportError("IPython is required for Jupyter display")
    
    # Generate HTML
    html_str = display_html(node, w=w, h=h, axes=axes, debug=debug, **kwargs)
    
    # Display in notebook
    return display(HTML(html_str))


def _render_to_container_id(node: GoFishNode,
                            container_id: str,
                            options: dict) -> Any:
    """
    Render to a container by ID.
    
    This assumes we have access to a DOM (web browser or Jupyter with DOM).
    """
    from .js_bridge import get_js_bridge
    js_bridge = get_js_bridge()
    
    # Get container element from JS
    # This depends on having a DOM available
    try:
        if hasattr(js_bridge, 'eval'):
            # Try to get container via JS
            container = js_bridge.eval(f'document.getElementById("{container_id}")')
            if container:
                js_options = convert_options(options)
                return node._js_node.render(container, js_options)
    except Exception:
        pass
    
    # Fallback: return HTML string
    return display_html(node, **options)
