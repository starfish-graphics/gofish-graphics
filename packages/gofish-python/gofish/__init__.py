"""
GoFish Python - A Python wrapper for GoFish graphics library.
"""

from .chart import chart, ChartBuilder
from .operators import spread, stack, derive, group, scatter
from .marks import rect, circle, line, area, scaffold

__all__ = [
    "chart",
    "ChartBuilder",
    "spread",
    "stack",
    "derive",
    "group",
    "scatter",
    "rect",
    "circle",
    "line",
    "area",
    "scaffold",
]

__version__ = "0.0.1"


