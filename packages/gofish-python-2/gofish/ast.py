"""AST classes for building GoFish chart specifications."""

from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
import uuid

T = TypeVar("T")


class Operator:
    """Base class for chart operators."""

    def __init__(self, op_type: str, **kwargs):
        self.op_type = op_type
        self.kwargs = kwargs

    def to_dict(self) -> dict:
        """Convert operator to dictionary for JSON IR."""
        return {"type": self.op_type, **self.kwargs}


class DeriveOperator(Operator):
    """Operator for deriving new data via Python function."""

    def __init__(self, fn: Callable):
        super().__init__("derive")
        self.fn = fn
        self.lambda_id = str(uuid.uuid4())

    def to_dict(self) -> dict:
        """Convert to dict - return lambda ID."""
        return {"type": "derive", "lambdaId": self.lambda_id}


class Mark:
    """Base class for chart marks."""

    def __init__(self, mark_type: str, **kwargs):
        self.mark_type = mark_type
        self.kwargs = kwargs

    def to_dict(self) -> dict:
        """Convert mark to dictionary for JSON IR."""
        return {"type": self.mark_type, **self.kwargs}


class ChartBuilder:
    """Builder class for creating GoFish charts."""

    def __init__(
        self,
        data: Any,
        options: Optional[dict] = None,
        operators: Optional[List[Operator]] = None,
    ):
        """
        Initialize a ChartBuilder.

        Args:
            data: Input data (not serialized in IR)
            options: Chart options (w, h, coord, etc.)
            operators: List of operators to apply
        """
        self.data = data
        self.options = options or {}
        self.operators: List[Operator] = operators or []
        self._mark: Optional[Mark] = None

    def flow(self, *ops: Operator) -> "ChartBuilder":
        """
        Add operators to the flow pipeline.

        Args:
            *ops: One or more operators (spread, stack, derive, etc.)

        Returns:
            New ChartBuilder with operators added
        """
        return ChartBuilder(
            self.data,
            self.options,
            operators=[*self.operators, *ops],
        )

    def mark(self, mark: Mark) -> "ChartBuilder":
        """
        Set the mark (visual encoding) for the chart.

        Args:
            mark: A mark function (rect, circle, line, etc.)

        Returns:
            New ChartBuilder with mark set
        """
        new_builder = ChartBuilder(self.data, self.options, self.operators)
        new_builder._mark = mark
        return new_builder

    def to_ir(self) -> dict:
        """
        Convert the chart specification to JSON IR.

        Returns:
            Dictionary representing the chart IR:
            {
                "data": None,  # Data is not included in IR
                "operators": [...],
                "mark": {...},
                "options": {...}
            }
        """
        if self._mark is None:
            raise ValueError("Chart must have a mark before converting to IR")

        return {
            "data": None,
            "operators": [op.to_dict() for op in self.operators],
            "mark": self._mark.to_dict(),
            "options": self.options,
        }

    def render(
        self,
        w: int = 800,
        h: int = 600,
        axes: bool = False,
        debug: bool = False,
    ):
        """
        Render the chart as an anywidget for Jupyter notebooks.

        Args:
            w: Chart width in pixels
            h: Chart height in pixels
            axes: Whether to show axes
            debug: Whether to enable debug mode

        Returns:
            GoFishChartWidget instance that will display in Jupyter

        Example:
            >>> data = [{"x": 1, "y": 2}]
            >>> chart(data).mark(rect(h="y")).render()
            >>> chart(data).mark(rect(h="y")).render(w=500, h=300)
        """
        if self._mark is None:
            raise ValueError("Chart must have a mark before rendering")

        # Import here to avoid circular dependencies
        from .widget import GoFishChartWidget
        from .arrow_utils import dataframe_to_arrow
        import pandas as pd

        # Convert data to Arrow format
        if isinstance(self.data, pd.DataFrame):
            df = self.data
        elif self.data is None:
            # Empty data
            df = pd.DataFrame()
        else:
            # Try to convert to DataFrame
            df = pd.DataFrame(self.data)

        # Convert to Arrow (even if empty)
        if len(df) == 0:
            # Create empty Arrow table with a dummy schema
            import pyarrow as pa

            schema = pa.schema([pa.field("_placeholder", pa.int32())])
            table = pa.Table.from_arrays([], schema=schema)
            sink = pa.BufferOutputStream()
            with pa.ipc.new_stream(sink, schema) as writer:
                writer.write_table(table)
            arrow_data = sink.getvalue().to_pybytes()
        else:
            arrow_data = dataframe_to_arrow(df)

        # Get the IR spec
        spec = self.to_ir()

        # Create and return widget
        widget = GoFishChartWidget(
            spec=spec,
            arrow_data=arrow_data,
            width=w,
            height=h,
            axes=axes,
            debug=debug,
        )

        return widget


# Operator factory functions


def spread(
    field_or_options: Union[str, Dict[str, Any]],
    **options: Any,
) -> Operator:
    """
    Spread operator - groups data and spaces them apart.

    Args:
        field_or_options: Field name (str) or options dict
        **options: Options including dir, spacing, alignment, etc.

    Returns:
        Operator object
    """
    if isinstance(field_or_options, str):
        opts = {"field": field_or_options, **options}
    else:
        opts = {**field_or_options, **options}

    if "dir" not in opts:
        raise ValueError("spread() requires 'dir' option ('x' or 'y')")

    return Operator("spread", **opts)


def stack(
    field: str,
    dir: Optional[str] = None,
    **options: Any,
) -> Operator:
    """
    Stack operator - stacks data elements.

    Args:
        field: Field name to stack by
        dir: Direction "x" or "y"
        **options: Additional options

    Returns:
        Operator object
    """
    if dir is not None:
        options["dir"] = dir
    if "dir" not in options:
        raise ValueError("stack() requires 'dir' option ('x' or 'y')")
    return Operator("stack", field=field, **options)


def derive(fn: Callable) -> DeriveOperator:
    """
    Derive operator - apply a Python function to transform data.

    Args:
        fn: Function that takes data and returns transformed data

    Returns:
        DeriveOperator object
    """
    return DeriveOperator(fn)


def group(field: str) -> Operator:
    """
    Group operator - group data by a field.

    Args:
        field: Field name to group by

    Returns:
        Operator object
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
        **options: Additional options

    Returns:
        Operator object
    """
    return Operator("scatter", field=field, x=x, y=y, **options)


# Mark factory functions


def rect(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    fill: Optional[str] = None,
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
    """Rectangle mark."""
    kwargs: Dict[str, Any] = {}
    for key, value in [
        ("w", w),
        ("h", h),
        ("fill", fill),
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("rx", rx),
        ("ry", ry),
        ("emX", emX),
        ("emY", emY),
        ("rs", rs),
        ("ts", ts),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[key] = value
    return Mark("rect", **kwargs)


def circle(
    r: Optional[Union[int, str]] = None,
    fill: Optional[str] = None,
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """Circle mark."""
    kwargs: Dict[str, Any] = {}
    for key, value in [
        ("r", r),
        ("fill", fill),
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[key] = value
    return Mark("circle", **kwargs)


def line(
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    opacity: Optional[float] = None,
    interpolation: Optional[str] = None,
) -> Mark:
    """Line mark."""
    kwargs: Dict[str, Any] = {}
    for key, value in [
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("opacity", opacity),
        ("interpolation", interpolation),
    ]:
        if value is not None:
            kwargs[key] = value
    return Mark("line", **kwargs)


def area(
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    opacity: Optional[float] = None,
    mixBlendMode: Optional[str] = None,
    dir: Optional[str] = None,
    interpolation: Optional[str] = None,
) -> Mark:
    """Area mark."""
    kwargs: Dict[str, Any] = {}
    for key, value in [
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("opacity", opacity),
        ("mixBlendMode", mixBlendMode),
        ("dir", dir),
        ("interpolation", interpolation),
    ]:
        if value is not None:
            kwargs[key] = value
    return Mark("area", **kwargs)


def scaffold(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    **kwargs: Any,
) -> Mark:
    """Scaffold mark - invisible guide for positioning."""
    scaffold_kwargs: Dict[str, Any] = {}
    if w is not None:
        scaffold_kwargs["w"] = w
    if h is not None:
        scaffold_kwargs["h"] = h
    scaffold_kwargs.update(kwargs)
    return Mark("scaffold", **scaffold_kwargs)


def chart(data: Any, options: Optional[dict] = None) -> ChartBuilder:
    """
    Create a new chart builder.

    Args:
        data: Input data
        options: Optional chart options

    Returns:
        ChartBuilder instance
    """
    return ChartBuilder(data, options)
