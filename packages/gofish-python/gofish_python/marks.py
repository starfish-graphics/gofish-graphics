"""
Python wrappers for GoFish marks (shapes).

Marks define the visual representation of data. All marks create
JavaScript functions that are executed in the JS runtime.
"""

from typing import Any, Union, Optional, Literal
from .js_bridge import get_gofish
from .utils import convert_options, to_js


class Mark:
    """Base class for marks that wraps JavaScript functions."""
    
    def __init__(self, js_value: Any):
        """Initialize mark with JavaScript function."""
        self._js_value = js_value
    
    def __call__(self, data: Any, key: Optional[str] = None) -> Any:
        """Make mark callable (for compatibility)."""
        return self._js_value(data, key)


def rect(w: Optional[Union[int, str]] = None,
         h: Optional[Union[int, str]] = None,
         fill: Optional[Union[str, Any]] = None,
         stroke: Optional[str] = None,
         strokeWidth: Optional[int] = None,
         rx: Optional[float] = None,
         ry: Optional[float] = None,
         **kwargs) -> Mark:
    """
    Rectangle mark.
    
    Args:
        w: Width (number or field name)
        h: Height (number or field name)
        fill: Fill color (string or field name)
        stroke: Stroke color
        strokeWidth: Stroke width
        rx: X corner radius
        ry: Y corner radius
        **kwargs: Additional options (emX, emY, rs, ts, debug)
    
    Returns:
        Mark instance
    
    Example:
        >>> rect(h="frequency")
        >>> rect(w=10, h="count", fill="species")
    """
    gofish = get_gofish()
    opts = {"w": w, "h": h, "fill": fill, "stroke": stroke,
            "strokeWidth": strokeWidth, "rx": rx, "ry": ry}
    opts.update(kwargs)
    opts = {k: v for k, v in opts.items() if v is not None}
    js_opts = convert_options(opts)
    js_mark = gofish.rect(js_opts)
    return Mark(js_mark)


def circle(r: Optional[Union[float, str]] = None,
           fill: Optional[Union[str, Any]] = None,
           stroke: Optional[str] = None,
           strokeWidth: Optional[int] = None,
           **kwargs) -> Mark:
    """
    Circle mark.
    
    Args:
        r: Radius (number or field name)
        fill: Fill color (string or field name)
        stroke: Stroke color
        strokeWidth: Stroke width
        **kwargs: Additional options (debug)
    
    Returns:
        Mark instance
    
    Example:
        >>> circle(r=5, fill="species")
    """
    gofish = get_gofish()
    opts = {"r": r, "fill": fill, "stroke": stroke, "strokeWidth": strokeWidth}
    opts.update(kwargs)
    opts = {k: v for k, v in opts.items() if v is not None}
    js_opts = convert_options(opts)
    js_mark = gofish.circle(js_opts)
    return Mark(js_mark)


def line(stroke: Optional[str] = None,
         strokeWidth: Optional[int] = None,
         opacity: Optional[float] = None,
         interpolation: Optional[Literal["linear", "bezier"]] = None,
         **kwargs) -> Mark:
    """
    Line mark - connects data points.
    
    Args:
        stroke: Stroke color
        strokeWidth: Stroke width
        opacity: Opacity (0-1)
        interpolation: "linear" or "bezier"
        **kwargs: Additional options
    
    Returns:
        Mark instance
    
    Example:
        >>> line(stroke="blue", strokeWidth=2)
    """
    gofish = get_gofish()
    opts = {"stroke": stroke, "strokeWidth": strokeWidth,
            "opacity": opacity, "interpolation": interpolation}
    opts.update(kwargs)
    opts = {k: v for k, v in opts.items() if v is not None}
    js_opts = convert_options(opts)
    js_mark = gofish.line(js_opts)
    return Mark(js_mark)


def area(stroke: Optional[str] = None,
         strokeWidth: Optional[int] = None,
         opacity: Optional[float] = None,
         mixBlendMode: Optional[Literal["normal", "multiply"]] = None,
         dir: Optional[Literal["x", "y"]] = None,
         interpolation: Optional[Literal["linear", "bezier"]] = None,
         **kwargs) -> Mark:
    """
    Area mark - filled area connecting data points.
    
    Args:
        stroke: Stroke color
        strokeWidth: Stroke width
        opacity: Opacity (0-1)
        mixBlendMode: Blend mode
        dir: Direction "x" or "y"
        interpolation: "linear" or "bezier"
        **kwargs: Additional options
    
    Returns:
        Mark instance
    
    Example:
        >>> area(opacity=0.8, interpolation="bezier")
    """
    gofish = get_gofish()
    opts = {"stroke": stroke, "strokeWidth": strokeWidth, "opacity": opacity,
            "mixBlendMode": mixBlendMode, "dir": dir, "interpolation": interpolation}
    opts.update(kwargs)
    opts = {k: v for k, v in opts.items() if v is not None}
    js_opts = convert_options(opts)
    js_mark = gofish.area(js_opts)
    return Mark(js_mark)


def scaffold(w: Optional[Union[int, str]] = None,
             h: Optional[Union[int, str]] = None,
             fill: Optional[Union[str, Any]] = None,
             **kwargs) -> Mark:
    """
    Scaffold mark - invisible guides for positioning.
    
    Args:
        w: Width (number or field name)
        h: Height (number or field name)
        fill: Fill color (usually transparent)
        **kwargs: Additional options (same as rect)
    
    Returns:
        Mark instance
    
    Example:
        >>> scaffold(h="count")
    """
    gofish = get_gofish()
    opts = {"w": w, "h": h, "fill": fill}
    opts.update(kwargs)
    opts = {k: v for k, v in opts.items() if v is not None}
    js_opts = convert_options(opts)
    js_mark = gofish.scaffold(js_opts)
    return Mark(js_mark)


def select(layer_name: str) -> list:
    """
    Select data from a named layer.
    
    Args:
        layer_name: Name of the layer (from .as_layer())
    
    Returns:
        List of data items from the layer
    
    Example:
        >>> chart(data).mark(rect(...)).as_layer("bars")
        >>> chart(select("bars")).mark(area(...))
    """
    gofish = get_gofish()
    js_data = gofish.select(layer_name)
    
    # Convert JS data back to Python
    from .utils import from_js
    return from_js(js_data)
