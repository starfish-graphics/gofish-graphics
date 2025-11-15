"""
GoFish Python: A Python wrapper for GoFish Graphics

This package provides a Python API that mirrors the JavaScript GoFish syntax.
JavaScript is the source of truth for rendering and reactivity, using SolidJS
for interactive and animated graphics.
"""

from .wrapper import ChartBuilder, chart
from .operators import spread, stack, scatter, group, derive, normalize, repeat, log
from .marks import rect, circle, line, area, scaffold, select
from .render import render, display_html, display_jupyter
from .utils import to_js, from_js

__version__ = "0.1.0"

__all__ = [
    # Core API
    "chart",
    "ChartBuilder",
    # Operators
    "spread",
    "stack",
    "scatter",
    "group",
    "derive",
    "normalize",
    "repeat",
    "log",
    # Marks
    "rect",
    "circle",
    "line",
    "area",
    "scaffold",
    "select",
    # Rendering
    "render",
    "display_html",
    "display_jupyter",
    # Utilities
    "to_js",
    "from_js",
]
