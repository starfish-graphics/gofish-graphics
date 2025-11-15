"""
Python wrapper for GoFish ChartBuilder API.

This module provides Python classes that mirror the JavaScript GoFish API,
translating Python calls to JavaScript execution. JavaScript is the source
of truth for all rendering, layout, and reactivity.
"""

from typing import Any, Optional, Union, Callable
from .js_bridge import get_gofish
from .utils import to_js, convert_options, ensure_list


class ChartBuilder:
    """
    Python wrapper for GoFish ChartBuilder.
    
    Mirrors the JavaScript API:
        chart(data).flow(op1, op2).mark(shape).render(container, options)
    
    All actual computation and rendering happens in JavaScript.
    """
    
    def __init__(self, data: Any, options: Optional[dict] = None, js_builder: Any = None):
        """
        Initialize a ChartBuilder.
        
        Args:
            data: Python data (list, dict, pandas DataFrame, etc.)
            options: Optional chart options (w, h, coord, etc.)
            js_builder: Internal JS ChartBuilder instance (for chaining)
        """
        self._data = data
        self._options = options or {}
        self._js_builder = js_builder
        self._gofish = get_gofish()
        
        # Create JS builder if not provided (initial chart() call)
        if js_builder is None:
            js_data = to_js(ensure_list(data))
            js_options = convert_options(options)
            self._js_builder = self._gofish.chart(js_data, js_options)
    
    def flow(self, *ops: Any) -> 'ChartBuilder':
        """
        Add operators to the chart pipeline.
        
        Args:
            *ops: One or more operators (spread, stack, scatter, etc.)
        
        Returns:
            New ChartBuilder with operators applied (for chaining)
        """
        # Convert Python operators to JS operators
        js_ops = [self._convert_operator(op) for op in ops]
        
        # Call JS flow method
        js_builder = self._js_builder.flow(*js_ops)
        
        # Return new Python wrapper
        return ChartBuilder(self._data, self._options, js_builder)
    
    def mark(self, mark_fn: Union[Callable, Any]) -> 'GoFishNode':
        """
        Apply a mark (shape) to the chart.
        
        Args:
            mark_fn: A mark function (rect, circle, etc.)
        
        Returns:
            GoFishNode that can be rendered
        """
        # Convert Python mark to JS mark
        js_mark = self._convert_mark(mark_fn)
        
        # Call JS mark method
        js_node = self._js_builder.mark(js_mark)
        
        # Return Python wrapper
        from .node import GoFishNode
        return GoFishNode(js_node, self._data)
    
    def _convert_operator(self, op: Any) -> Any:
        """Convert Python operator to JavaScript operator."""
        # If it's already a JS object, return as-is
        if hasattr(op, '_js_value'):
            return op._js_value
        
        # If it's a Python function, we need to wrap it
        # For now, operators should be created via the operators module
        # which returns JS-compatible objects
        return op
    
    def _convert_mark(self, mark_fn: Union[Callable, Any]) -> Any:
        """Convert Python mark function to JavaScript mark function."""
        # If it's already a JS mark function, return as-is
        if hasattr(mark_fn, '_js_value'):
            return mark_fn._js_value
        
        # If it's a Python callable, wrap it to convert data
        if callable(mark_fn):
            def js_mark_wrapper(data, key=None):
                # Convert JS data back to Python for the mark function
                from .utils import from_js
                py_data = from_js(data)
                # Call Python mark function
                result = mark_fn(py_data, key)
                # Convert result back to JS
                if hasattr(result, '_js_value'):
                    return result._js_value
                return result
            return js_mark_wrapper
        
        return mark_fn


def chart(data: Any, **options) -> ChartBuilder:
    """
    Create a new chart with data.
    
    This is the entry point for the GoFish Python API.
    
    Args:
        data: Data for the chart (list, dict, pandas DataFrame, etc.)
        **options: Chart options (w, h, coord, etc.)
    
    Returns:
        ChartBuilder instance for chaining
    
    Example:
        >>> chart([{"x": 1, "y": 2}]).flow(spread("x")).mark(rect(h="y")).render(...)
    """
    return ChartBuilder(data, options)
