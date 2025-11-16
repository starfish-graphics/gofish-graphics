"""Operators for data transformation in GoFish charts."""

from typing import Any, Callable, Dict, Optional, TypeVar, Union
import pandas as pd

T = TypeVar("T")


class Operator:
    """Base class for chart operators."""

    def __init__(self, op_type: str, **kwargs):
        self.op_type = op_type
        self.kwargs = kwargs

    def to_dict(self) -> dict:
        """Convert operator to dictionary for JSON serialization."""
        return {"type": self.op_type, **self.kwargs}


class DeriveOperator(Operator):
    """Operator for deriving new data via Python function."""

    def __init__(self, fn: Callable):
        super().__init__("derive")
        self.fn = fn
        # Store function source for debugging (optional)
        try:
            import inspect
            self._source = inspect.getsource(fn)
        except:
            self._source = None

    def execute(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Execute the derive function on the data.

        Args:
            data: Input DataFrame

        Returns:
            Transformed DataFrame
        """
        return self.fn(data)

    def to_dict(self) -> dict:
        """Convert to dict - note that function is not serializable."""
        return {"type": "derive", "python_function": True}


def spread(
    field_or_options: Union[str, Dict[str, Any]],
    **options: Any,
) -> Operator:
    """
    Spread operator - groups data and spaces them apart.

    Args:
        field_or_options: Field name (str) or options dict
        **options: Options including:
            - dir: "x" or "y" (required if field is str)
            - spacing: Number (default: 8)
            - alignment: "start", "middle", or "end" (default: "start")
            - label: bool (default: True)
            - mode: "edge" or "center"
            - sharedScale: bool
            - x, y, w, h: Position/size options

    Returns:
        Operator object

    Example:
        >>> spread("lake", dir="x", spacing=64)
        >>> spread({"dir": "x", "field": "lake", "spacing": 64})
    """
    if isinstance(field_or_options, str):
        # First arg is field name
        opts = {"field": field_or_options, **options}
    else:
        # First arg is options dict
        opts = {**field_or_options, **options}

    # Ensure dir is set
    if "dir" not in opts:
        raise ValueError("spread() requires 'dir' option ('x' or 'y')")

    return Operator("spread", **opts)


def stack(
    field: str,
    dir: str = None,
    **options: Any,
) -> Operator:
    """
    Stack operator - stacks data elements.

    Args:
        field: Field name to stack by
        dir: Direction "x" or "y" (can also be passed in options)
        **options: Additional options:
            - dir: Direction "x" or "y" (if not provided as positional arg)
            - spacing: Number (default: 0)
            - alignment: "start", "middle", or "end"
            - label: bool (default: True)
            - x, y, w, h: Position/size options

    Returns:
        Operator object

    Example:
        >>> stack("species", dir="y", label=False)
        >>> stack("species", {"dir": "y", "label": False})
    """
    if dir is not None:
        options["dir"] = dir
    if "dir" not in options:
        raise ValueError("stack() requires 'dir' option ('x' or 'y')")
    return Operator("stack", field=field, **options)


def derive(fn: Callable[[pd.DataFrame], pd.DataFrame]) -> DeriveOperator:
    """
    Derive operator - apply a Python function to transform data.

    Args:
        fn: Function that takes a DataFrame and returns a DataFrame

    Returns:
        DeriveOperator object

    Example:
        >>> derive(lambda d: d.sort_values("count"))
        >>> derive(lambda d: d.groupby("x").sum().reset_index())
    """
    return DeriveOperator(fn)


def group(field: str) -> Operator:
    """
    Group operator - group data by a field.

    Args:
        field: Field name to group by

    Returns:
        Operator object

    Example:
        >>> group("species")
    """
    return Operator("group", field=field)


def scatter(
    field: str,
    x: str,
    y: str,
    **options: Any,
) -> Operator:
    """
    Scatter operator - position groups by average x and y values.

    Args:
        field: Field name to group by
        x: Field name for x coordinate
        y: Field name for y coordinate
        **options: Additional options (debug, etc.)

    Returns:
        Operator object

    Example:
        >>> scatter("lake", x="x", y="y")
    """
    return Operator("scatter", field=field, x=x, y=y, **options)

