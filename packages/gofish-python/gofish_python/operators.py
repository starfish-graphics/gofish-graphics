"""
Python wrappers for GoFish operators.

Operators transform data and specify layout. All operators create
JavaScript functions that are executed in the JS runtime.
"""

from typing import Any, Union, Callable, Literal, Optional
from .js_bridge import get_gofish
from .utils import to_js, convert_options


class Operator:
    """Base class for operators that wraps JavaScript functions."""
    
    def __init__(self, js_value: Any):
        """Initialize operator with JavaScript function."""
        self._js_value = js_value


def spread(field_or_options: Union[str, dict] = None, **options) -> Operator:
    """
    Spread operator - create one group per field value and arrange them.
    
    Args:
        field_or_options: Field name (str) or options dict
        **options: Options including:
            - dir: "x" or "y" (required if field is first arg)
            - x, y: Position
            - w, h: Width/height
            - mode: "edge" or "center"
            - spacing: Spacing between groups
            - alignment: "start", "middle", or "end"
            - label: Whether to label groups
    
    Returns:
        Operator instance
    
    Example:
        >>> spread("letter", dir="x")
        >>> spread("letter", {"dir": "x", "spacing": 8})
    """
    gofish = get_gofish()
    
    # Handle two calling styles:
    # 1. spread("field", dir="x")
    # 2. spread({"field": ..., "dir": "x"})
    if isinstance(field_or_options, dict):
        js_options = convert_options(field_or_options)
        js_op = gofish.spread(js_options)
    elif isinstance(field_or_options, str):
        # Field name provided as first arg
        opts = convert_options(options)
        js_op = gofish.spread(field_or_options, opts)
    else:
        # Only options provided as kwargs
        opts = convert_options(options)
        js_op = gofish.spread(opts)
    
    return Operator(js_op)


def stack(field: str, dir: Literal["x", "y"], **options) -> Operator:
    """
    Stack operator - stack groups with zero spacing.
    
    Args:
        field: Field to stack by
        dir: Direction "x" or "y"
        **options: Additional options (x, y, w, h, spacing, alignment)
    
    Returns:
        Operator instance
    
    Example:
        >>> stack("species", dir="y")
    """
    gofish = get_gofish()
    opts = convert_options(options)
    opts["dir"] = dir
    js_op = gofish.stack(field, opts)
    return Operator(js_op)


def scatter(field: str, x: str, y: str, **options) -> Operator:
    """
    Scatter operator - position groups by average x and y values.
    
    Args:
        field: Field to group by
        x: Field name for x position
        y: Field name for y position
        **options: Additional options (debug)
    
    Returns:
        Operator instance
    
    Example:
        >>> scatter("lake", x="x", y="y")
    """
    gofish = get_gofish()
    opts = convert_options(options)
    opts["x"] = x
    opts["y"] = y
    js_op = gofish.scatter(field, opts)
    return Operator(js_op)


def group(field: str) -> Operator:
    """
    Group operator - group data by field.
    
    Args:
        field: Field name to group by
    
    Returns:
        Operator instance
    
    Example:
        >>> group("species")
    """
    gofish = get_gofish()
    js_op = gofish.group(field)
    return Operator(js_op)


def derive(fn: Callable) -> Operator:
    """
    Derive operator - transform data with a function.
    
    Args:
        fn: Python function that transforms data
    
    Returns:
        Operator instance
    
    Example:
        >>> derive(lambda d: sorted(d, key=lambda x: x["count"]))
    """
    gofish = get_gofish()
    
    # Wrap Python function to work with JS
    def js_derive_fn(data):
        from .utils import from_js, to_js
        py_data = from_js(data)
        result = fn(py_data)
        return to_js(result)
    
    js_op = gofish.derive(js_derive_fn)
    return Operator(js_op)


def normalize(field: str) -> Operator:
    """
    Normalize operator - normalize values by field to sum to 1.
    
    Note: This should be used on the data before chart(), not as an operator.
    For now, we provide it for completeness but it may need special handling.
    
    Args:
        field: Field name to normalize
    
    Returns:
        Operator instance
    """
    # This might need to be applied differently
    # For now, treat it as a derive operator
    return derive(lambda data: _normalize_data(data, field))


def _normalize_data(data: list, field: str) -> list:
    """Helper to normalize data by a field."""
    total = sum(item.get(field, 0) for item in data)
    if total == 0:
        return data
    return [{**item, field: item.get(field, 0) / total} for item in data]


def repeat(field: str) -> Operator:
    """
    Repeat operator - repeat each item field times.
    
    Note: This needs to be applied to individual items, not as a flow operator.
    May need special handling.
    
    Args:
        field: Field name containing count
    
    Returns:
        Operator instance
    """
    # This is typically used differently - may need to be a mark function
    # For now, provide as derive
    return derive(lambda data: _repeat_data(data, field))


def _repeat_data(data: list, field: str) -> list:
    """Helper to repeat items."""
    result = []
    for item in data:
        count = item.get(field, 0)
        result.extend([item] * int(count))
    return result


def log(label: Optional[str] = None) -> Operator:
    """
    Log operator - log data for debugging.
    
    Args:
        label: Optional label for log output
    
    Returns:
        Operator instance
    
    Example:
        >>> log("after grouping")
    """
    gofish = get_gofish()
    js_op = gofish.log(label) if label else gofish.log()
    return Operator(js_op)
