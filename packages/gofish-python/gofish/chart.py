"""Chart builder and main API entry point."""

from typing import Any, Callable, List, Optional, TypeVar, Generic
import pandas as pd

T = TypeVar("T")
U = TypeVar("U")


class ChartBuilder(Generic[T, U]):
    """Builder class for creating GoFish charts."""

    def __init__(
        self,
        data: T,
        options: Optional[dict] = None,
        operators: Optional[List[Any]] = None,
    ):
        """
        Initialize a ChartBuilder.

        Args:
            data: Input data (typically a pandas DataFrame)
            options: Chart options (w, h, coord, etc.)
            operators: List of operators to apply
        """
        self.data = data
        self.options = options or {}
        self.operators: List[Any] = operators or []

    def flow(self, *ops: Any) -> "ChartBuilder[T, Any]":
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

    def mark(self, mark: Any) -> "ChartBuilder[T, Any]":
        """
        Set the mark (visual encoding) for the chart.

        Args:
            mark: A mark function (rect, circle, line, etc.)

        Returns:
            ChartBuilder with mark set (ready to render)
        """
        self._mark = mark
        return self

    def render(
        self,
        w: Optional[int] = None,
        h: Optional[int] = None,
        axes: bool = False,
        debug: bool = False,
        filename: Optional[str] = None,
    ) -> Any:
        """
        Render the chart.

        Args:
            w: Width of the chart
            h: Height of the chart
            axes: Whether to show axes
            debug: Whether to enable debug mode
            filename: Optional filename to save HTML (for standalone scripts)

        Returns:
            Display object (for Jupyter) or None
        """
        # Merge options
        render_options = {
            **self.options,
            "w": w or self.options.get("w", 800),
            "h": h or self.options.get("h", 600),
            "axes": axes,
            "debug": debug,
        }

        from .render import render_chart_spec
        
        return render_chart_spec(
            self.data,
            self.operators,
            self._mark,
            render_options,
            filename=filename,
        )


def chart(
    data: T, options: Optional[dict] = None
) -> ChartBuilder[T, T]:
    """
    Create a new chart builder.

    Args:
        data: Input data (typically a pandas DataFrame)
        options: Optional chart options

    Returns:
        ChartBuilder instance

    Example:
        >>> chart(df).flow(spread("x")).mark(rect(h="y")).render()
    """
    return ChartBuilder(data, options)

