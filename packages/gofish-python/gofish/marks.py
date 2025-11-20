"""Marks (visual encodings) for GoFish charts."""

from typing import Any, Dict, Optional, Union


class Mark:
    """Base class for chart marks."""

    def __init__(self, mark_type: str, **kwargs):
        self.mark_type = mark_type
        self.kwargs = kwargs

    def to_dict(self) -> dict:
        """
        Convert mark to dictionary for JSON serialization.

        Returns:
            Dictionary representation of the mark for the IR.

        Example IR formats:
            - rect: {"type": "rect", "h": "count", "fill": "species", "w": 32}
            - circle: {"type": "circle", "r": 5, "fill": "blue"}
            - line: {"type": "line", "stroke": "blue", "strokeWidth": 2}
            - area: {"type": "area", "opacity": 0.8, "mixBlendMode": "multiply"}
            - scaffold: {"type": "scaffold", "w": 100, "h": 100}
        """
        return {"type": self.mark_type, **self.kwargs}


def rect(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    fill: Optional[Union[str, str]] = None,
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    rx: Optional[int] = None,
    ry: Optional[int] = None,
    emX: Optional[bool] = None,
    emY: Optional[bool] = None,
    rs: Optional[int] = None,
    ts: Optional[int] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """
    Rectangle mark.

    Args:
        w: Width (number or field name)
        h: Height (number or field name)
        fill: Fill color (color string or field name)
        stroke: Stroke color
        strokeWidth: Stroke width
        rx: X corner radius
        ry: Y corner radius
        emX: Embed in X direction
        emY: Embed in Y direction
        rs: Row size
        ts: Tile size
        debug: Enable debug mode

    Returns:
        Mark object

    Example:
        >>> rect(h="count", fill="species")
        >>> rect(w=32, h=100, fill="blue")
    """
    kwargs: Dict[str, Any] = {}
    if w is not None:
        kwargs["w"] = w
    if h is not None:
        kwargs["h"] = h
    if fill is not None:
        kwargs["fill"] = fill
    if stroke is not None:
        kwargs["stroke"] = stroke
    if strokeWidth is not None:
        kwargs["strokeWidth"] = strokeWidth
    if rx is not None:
        kwargs["rx"] = rx
    if ry is not None:
        kwargs["ry"] = ry
    if emX is not None:
        kwargs["emX"] = emX
    if emY is not None:
        kwargs["emY"] = emY
    if rs is not None:
        kwargs["rs"] = rs
    if ts is not None:
        kwargs["ts"] = ts
    if debug is not None:
        kwargs["debug"] = debug

    return Mark("rect", **kwargs)


def circle(
    r: Optional[Union[int, str]] = None,
    fill: Optional[Union[str, str]] = None,
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """
    Circle mark.

    Args:
        r: Radius (number or field name)
        fill: Fill color (color string or field name)
        stroke: Stroke color
        strokeWidth: Stroke width
        debug: Enable debug mode

    Returns:
        Mark object

    Example:
        >>> circle(r=5, fill="blue")
        >>> circle(r="size", fill="category")
    """
    kwargs: Dict[str, Any] = {}
    if r is not None:
        kwargs["r"] = r
    if fill is not None:
        kwargs["fill"] = fill
    if stroke is not None:
        kwargs["stroke"] = stroke
    if strokeWidth is not None:
        kwargs["strokeWidth"] = strokeWidth
    if debug is not None:
        kwargs["debug"] = debug

    return Mark("circle", **kwargs)


def line(
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    opacity: Optional[float] = None,
    interpolation: Optional[str] = None,
) -> Mark:
    """
    Line mark - connects data points.

    Args:
        stroke: Stroke color
        strokeWidth: Stroke width
        opacity: Opacity (0-1)
        interpolation: "linear" or "bezier"

    Returns:
        Mark object

    Example:
        >>> line(stroke="blue", strokeWidth=2)
    """
    kwargs: Dict[str, Any] = {}
    if stroke is not None:
        kwargs["stroke"] = stroke
    if strokeWidth is not None:
        kwargs["strokeWidth"] = strokeWidth
    if opacity is not None:
        kwargs["opacity"] = opacity
    if interpolation is not None:
        kwargs["interpolation"] = interpolation

    return Mark("line", **kwargs)


def area(
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    opacity: Optional[float] = None,
    mixBlendMode: Optional[str] = None,
    dir: Optional[str] = None,
    interpolation: Optional[str] = None,
) -> Mark:
    """
    Area mark - filled area connecting data points.

    Args:
        stroke: Stroke color
        strokeWidth: Stroke width
        opacity: Opacity (0-1)
        mixBlendMode: "normal" or "multiply"
        dir: Direction "x" or "y"
        interpolation: "linear" or "bezier"

    Returns:
        Mark object

    Example:
        >>> area(opacity=0.8, mixBlendMode="multiply")
    """
    kwargs: Dict[str, Any] = {}
    if stroke is not None:
        kwargs["stroke"] = stroke
    if strokeWidth is not None:
        kwargs["strokeWidth"] = strokeWidth
    if opacity is not None:
        kwargs["opacity"] = opacity
    if mixBlendMode is not None:
        kwargs["mixBlendMode"] = mixBlendMode
    if dir is not None:
        kwargs["dir"] = dir
    if interpolation is not None:
        kwargs["interpolation"] = interpolation

    return Mark("area", **kwargs)


def scaffold(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    **kwargs: Any,
) -> Mark:
    """
    Scaffold mark - invisible guide for positioning.

    Args:
        w: Width
        h: Height
        **kwargs: Additional rect options

    Returns:
        Mark object

    Example:
        >>> scaffold(w=100, h=100)
    """
    return Mark("scaffold", w=w, h=h, **kwargs)


