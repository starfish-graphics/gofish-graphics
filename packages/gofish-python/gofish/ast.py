"""AST classes for building GoFish chart specifications."""

from typing import Any, Callable, Dict, List, Optional, Tuple, TypeVar, Union
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
        self._name: Optional[str] = None

    def name(self, layer_name: str) -> "Mark":
        """
        Set a layer name on this mark for cross-chart referencing via select().

        Args:
            layer_name: Name to register this mark's output under

        Returns:
            New Mark with name set
        """
        new_mark = Mark(self.mark_type, **self.kwargs)
        new_mark._name = layer_name
        return new_mark

    def to_dict(self) -> dict:
        """Convert mark to dictionary for JSON IR."""
        d: dict = {"type": self.mark_type, **self.kwargs}
        if self._name is not None:
            d["name"] = self._name
        return d


class LayerSelector:
    """Sentinel object representing a cross-chart layer reference."""

    def __init__(self, layer_name: str):
        self.layer_name = layer_name


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
            data: Input data or LayerSelector for cross-chart references
            options: Chart options (w, h, coord, color, etc.)
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

    def facet(self, field: str, **kwargs: Any) -> "ChartBuilder":
        """
        Convenience method: spread data by field (shortcut for .flow(spread(field, ...))).

        Args:
            field: Field name to facet by
            **kwargs: Options passed to spread() (must include dir)

        Returns:
            New ChartBuilder with spread operator added
        """
        return self.flow(spread(field, **kwargs))

    def stack(self, field: str, **kwargs: Any) -> "ChartBuilder":
        """
        Convenience method: stack data by field (shortcut for .flow(stack(field, ...))).

        Args:
            field: Field name to stack by
            **kwargs: Options passed to stack() (must include dir)

        Returns:
            New ChartBuilder with stack operator added
        """
        return self.flow(_stack(field, **kwargs))

    def _build_v2_spec(self, data_list: List[dict]) -> Tuple[dict, List[dict]]:
        """
        Build the v2 pre-processed spec: a DataTree + augmented operator list.

        Runs all operators in Python:
          - derive: executed eagerly, stripped from IR
          - spread/stack/table/scatter/group: group data into tree levels
          - data-dependent config (inferSize, colKeys, rowKeys) pre-computed

        Returns:
            (data_tree_root, augmented_operators) where:
              - data_tree_root is the nested DataTreeNode dict
              - augmented_operators is the flat operator list sent to JS
        """
        augmented_ops = _collect_augmented_ops(data_list, self.operators)
        tree = _build_tree_only(data_list, self.operators)
        return tree, augmented_ops

    def to_ir(self) -> dict:
        """
        Convert the chart specification to JSON IR.

        Returns:
            Dictionary representing the chart IR
        """
        if self._mark is None:
            raise ValueError("Chart must have a mark before converting to IR")

        # Serialize data: LayerSelector becomes a select spec, otherwise None
        if isinstance(self.data, LayerSelector):
            data_ir: Any = {"type": "select", "layer": self.data.layer_name}
        else:
            data_ir = None

        return {
            "data": data_ir,
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

        # LayerSelector charts still use v1 path (no data transforms to run)
        if isinstance(self.data, LayerSelector):
            import pyarrow as pa
            schema = pa.schema([pa.field("_placeholder", pa.int32())])
            table = pa.Table.from_arrays([], schema=schema)
            sink = pa.BufferOutputStream()
            with pa.ipc.new_stream(sink, schema) as writer:
                writer.write_table(table)
            arrow_data = sink.getvalue().to_pybytes()
            spec = self.to_ir()
            derive_functions = {
                op.lambda_id: op.fn
                for op in self.operators
                if isinstance(op, DeriveOperator)
            }
            return GoFishChartWidget(
                spec=spec,
                arrow_data=arrow_data,
                derive_functions=derive_functions,
                width=w,
                height=h,
                axes=axes,
                debug=debug,
            )

        # v2 path: run all data transforms in Python, send pre-processed tree to JS
        if isinstance(self.data, pd.DataFrame):
            data_list = self.data.to_dict("records")
        elif self.data is None:
            data_list = []
        else:
            data_list = list(self.data)

        data_tree, augmented_ops = self._build_v2_spec(data_list)
        spec = {
            "version": 2,
            "dataTree": data_tree,
            "operators": augmented_ops,
            "mark": self._mark.to_dict(),
            "options": self.options,
            "data": None,
        }

        # No Arrow data needed (all data is in the tree as JSON)
        # and no derive functions (they ran eagerly in Python)
        return GoFishChartWidget(
            spec=spec,
            arrow_data=b"",
            derive_functions={},
            width=w,
            height=h,
            axes=axes,
            debug=debug,
        )


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


def _stack(
    field: str,
    dir: Optional[str] = None,
    **options: Any,
) -> Operator:
    """Internal stack operator used by ChartBuilder.stack() convenience method."""
    if dir is not None:
        options["dir"] = dir
    if "dir" not in options:
        raise ValueError("stack() requires 'dir' option ('x' or 'y')")
    return Operator("stack", field=field, **options)


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
    return _stack(field, dir, **options)


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


def log(label: Optional[str] = None) -> Operator:
    """
    Log operator - logs data to the console for debugging.

    Args:
        label: Optional label to prefix the log output

    Returns:
        Operator object
    """
    kwargs: Dict[str, Any] = {}
    if label is not None:
        kwargs["label"] = label
    return Operator("log", **kwargs)


# Color configuration


def palette(values: Any) -> dict:
    """
    Create a palette color configuration.

    Args:
        values: Palette name (e.g. "tableau10") or list of color strings

    Returns:
        Color config dict for use in chart options
    """
    return {"_tag": "palette", "values": values}


def gradient(stops: Union[str, List[str]]) -> dict:
    """
    Create a gradient color configuration.

    Args:
        stops: Color stop(s) - a single color string or list of color strings

    Returns:
        Color config dict for use in chart options
    """
    return {"_tag": "gradient", "stops": stops}


# Coordinate transforms


def clock() -> dict:
    """
    Clock coordinate transform — polar coordinates with 0° at 12 o'clock,
    increasing clockwise. Use as: chart(data, {"coord": clock()}).

    Returns:
        Coord config dict for use in chart options
    """
    return {"type": "clock"}


# Layer selection


def select(layer_name: str) -> LayerSelector:
    """
    Select a named layer from a previous chart for cross-chart referencing.

    Args:
        layer_name: Name of the layer to select (set via mark.name())

    Returns:
        LayerSelector sentinel for use as chart() data argument
    """
    return LayerSelector(layer_name)


# Data utilities (for use inside derive() callbacks)


def normalize(data: List[dict], field: str) -> List[dict]:
    """
    Normalize a numeric field so values sum to 1.

    Args:
        data: List of row dicts
        field: Field name to normalize

    Returns:
        New list of dicts with field normalized
    """
    total = sum(row[field] for row in data)
    if total == 0:
        return data
    return [{**row, field: row[field] / total} for row in data]


def repeat(row: dict, field: str) -> List[dict]:
    """
    Repeat a row N times based on a numeric field value.

    Args:
        row: A single data row dict
        field: Field name containing the repeat count

    Returns:
        List of copies of the row, length = row[field]
    """
    n = int(row[field])
    return [row] * n


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
    x: Optional[Union[int, str]] = None,
    y: Optional[Union[int, str]] = None,
    cx: Optional[Union[int, str]] = None,
    cy: Optional[Union[int, str]] = None,
    x2: Optional[Union[int, str]] = None,
    y2: Optional[Union[int, str]] = None,
    filter: Optional[str] = None,
    label: Optional[str] = None,
    key: Optional[str] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """Rectangle mark."""
    kwargs: Dict[str, Any] = {}
    for k, value in [
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
        ("x", x),
        ("y", y),
        ("cx", cx),
        ("cy", cy),
        ("x2", x2),
        ("y2", y2),
        ("filter", filter),
        ("label", label),
        ("key", key),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[k] = value
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
    for k, value in [
        ("r", r),
        ("fill", fill),
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[k] = value
    return Mark("circle", **kwargs)


def line(
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    opacity: Optional[float] = None,
    interpolation: Optional[str] = None,
) -> Mark:
    """Line mark."""
    kwargs: Dict[str, Any] = {}
    for k, value in [
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("opacity", opacity),
        ("interpolation", interpolation),
    ]:
        if value is not None:
            kwargs[k] = value
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
    for k, value in [
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("opacity", opacity),
        ("mixBlendMode", mixBlendMode),
        ("dir", dir),
        ("interpolation", interpolation),
    ]:
        if value is not None:
            kwargs[k] = value
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


def ellipse(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    fill: Optional[str] = None,
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """Ellipse mark."""
    kwargs: Dict[str, Any] = {}
    for k, value in [
        ("w", w),
        ("h", h),
        ("fill", fill),
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[k] = value
    return Mark("ellipse", **kwargs)


def petal(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    fill: Optional[str] = None,
    stroke: Optional[str] = None,
    strokeWidth: Optional[int] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """Petal mark."""
    kwargs: Dict[str, Any] = {}
    for k, value in [
        ("w", w),
        ("h", h),
        ("fill", fill),
        ("stroke", stroke),
        ("strokeWidth", strokeWidth),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[k] = value
    return Mark("petal", **kwargs)


def text(
    fill: Optional[str] = None,
    fontSize: Optional[Union[int, str]] = None,
    fontWeight: Optional[Union[int, str]] = None,
    label: Optional[str] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """Text mark."""
    kwargs: Dict[str, Any] = {}
    for k, value in [
        ("fill", fill),
        ("fontSize", fontSize),
        ("fontWeight", fontWeight),
        ("label", label),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[k] = value
    return Mark("text", **kwargs)


def image(
    w: Optional[Union[int, str]] = None,
    h: Optional[Union[int, str]] = None,
    src: Optional[str] = None,
    debug: Optional[bool] = None,
) -> Mark:
    """Image mark."""
    kwargs: Dict[str, Any] = {}
    for k, value in [
        ("w", w),
        ("h", h),
        ("src", src),
        ("debug", debug),
    ]:
        if value is not None:
            kwargs[k] = value
    return Mark("image", **kwargs)


def _groupby_ordered(data: List[dict], field: str) -> Dict[str, List[dict]]:
    """Group a list of dicts by field, preserving first-seen key order (like JS Map.groupBy)."""
    groups: Dict[str, List[dict]] = {}
    for row in data:
        key = str(row.get(field, ""))
        if key not in groups:
            groups[key] = []
        groups[key].append(row)
    return groups


def _infer_size(accessor: Any, data: List[dict]) -> Any:
    """Python equivalent of JS inferSize: sum a named field across data, or pass through a number."""
    if isinstance(accessor, (int, float)):
        return accessor
    if isinstance(accessor, str) and data:
        return sum(row.get(accessor, 0) for row in data)
    return None


def _collect_augmented_ops(data: List[dict], operators: List["Operator"]) -> List[dict]:
    """
    Build the flat augmented operator list for the v2 IR.

    Processes operators in sequence, computing data-dependent config values
    (inferSize for spread w/h, colKeys/rowKeys for table) using the data
    as it exists at each point in the flat pipeline. Derive operators run
    eagerly to advance the data; all other operators add an entry.
    """
    result: List[dict] = []
    current_data = data
    for op in operators:
        if isinstance(op, DeriveOperator):
            transformed = op.fn(current_data)
            if not isinstance(transformed, list):
                transformed = [transformed] if transformed is not None else []
            current_data = transformed
        elif op.op_type in ("spread", "stack"):
            op_dict = op.to_dict()
            if "w" in op.kwargs:
                op_dict["w"] = _infer_size(op.kwargs["w"], current_data)
            if "h" in op.kwargs:
                op_dict["h"] = _infer_size(op.kwargs["h"], current_data)
            result.append(op_dict)
        elif op.op_type == "table":
            x_field = op.kwargs.get("xField") or op.kwargs.get("x_field", "")
            y_field = op.kwargs.get("yField") or op.kwargs.get("y_field", "")
            col_keys = list(dict.fromkeys(str(row.get(x_field, "")) for row in current_data))
            row_keys = list(dict.fromkeys(str(row.get(y_field, "")) for row in current_data))
            spacing = op.kwargs.get("spacing")
            x_spacing = op.kwargs.get("xSpacing") or spacing or 2
            y_spacing = op.kwargs.get("ySpacing") or spacing or 2
            op_dict = {
                **op.to_dict(),
                "numCols": len(col_keys),
                "colKeys": col_keys,
                "rowKeys": row_keys,
                "spacing": [x_spacing, y_spacing],
            }
            result.append(op_dict)
        else:
            result.append(op.to_dict())
    return result


def _build_tree_only(data: List[dict], operators: List["Operator"]) -> dict:
    """
    Recursively build a DataTreeNode from data and operators.

    Each grouping operator consumes one level of the data, producing children.
    Derive operators run eagerly on the current data slice and are consumed.
    Log operators are transparent (no tree effect).

    Returns a DataTreeNode dict with either 'data' (leaf) or 'children' (non-leaf).
    """
    if not operators:
        return {"data": data}

    op = operators[0]
    rest = operators[1:]

    if isinstance(op, DeriveOperator):
        transformed = op.fn(data)
        if not isinstance(transformed, list):
            transformed = [transformed] if transformed is not None else []
        return _build_tree_only(transformed, rest)

    if op.op_type == "log":
        return _build_tree_only(data, rest)

    if op.op_type in ("spread", "stack"):
        field = op.kwargs.get("field")
        if field:
            groups = _groupby_ordered(data, field)
        else:
            groups = {str(i): [item] for i, item in enumerate(data)}
        children = []
        for key, group_data in groups.items():
            child = _build_tree_only(group_data, rest)
            child["key"] = key
            children.append(child)
        return {"children": children}

    if op.op_type == "table":
        x_field = op.kwargs.get("xField") or op.kwargs.get("x_field", "")
        y_field = op.kwargs.get("yField") or op.kwargs.get("y_field", "")
        col_keys = list(dict.fromkeys(str(row.get(x_field, "")) for row in data))
        row_keys = list(dict.fromkeys(str(row.get(y_field, "")) for row in data))
        children = []
        for row_key in row_keys:
            for col_key in col_keys:
                cell_data = [
                    row for row in data
                    if str(row.get(x_field, "")) == col_key
                    and str(row.get(y_field, "")) == row_key
                ]
                child = _build_tree_only(cell_data, rest)
                child["key"] = f"{col_key}-{row_key}"
                child["colKey"] = col_key
                child["rowKey"] = row_key
                children.append(child)
        return {"children": children}

    if op.op_type == "scatter":
        field = op.kwargs.get("field", "")
        x_field = op.kwargs.get("x", "")
        y_field = op.kwargs.get("y", "")
        groups = _groupby_ordered(data, field)
        children = []
        for key, group_data in groups.items():
            avg_x = sum(row.get(x_field, 0) for row in group_data) / len(group_data) if group_data else 0
            avg_y = sum(row.get(y_field, 0) for row in group_data) / len(group_data) if group_data else 0
            child = _build_tree_only(group_data, rest)
            child["key"] = key
            child["x"] = avg_x
            child["y"] = avg_y
            children.append(child)
        return {"children": children}

    if op.op_type == "group":
        field = op.kwargs.get("field", "")
        groups = _groupby_ordered(data, field)
        children = []
        for key, group_data in groups.items():
            child = _build_tree_only(group_data, rest)
            child["key"] = key
            children.append(child)
        return {"children": children}

    # Unknown operator: treat data as leaf at this level
    return {"data": data}


def _build_data_tree(
    data: List[dict],
    operators: List["Operator"],
    _unused: List[dict],
) -> dict:
    """Wrapper kept for API compatibility; delegates to _build_tree_only."""
    return _build_tree_only(data, operators)


def chart(data: Any, options: Optional[dict] = None) -> ChartBuilder:
    """
    Create a new chart builder.

    Args:
        data: Input data or select() for cross-chart layer references
        options: Optional chart options (w, h, color, etc.)

    Returns:
        ChartBuilder instance
    """
    return ChartBuilder(data, options)


class LayerBuilder:
    """Builder class for composing multiple ChartBuilder instances as a layer."""

    def __init__(
        self,
        children: List[ChartBuilder],
        options: Optional[dict] = None,
    ):
        self.children = children
        self.options = options or {}

    def to_ir(self) -> dict:
        """Convert the layer specification to JSON IR."""
        return {
            "type": "layer",
            "charts": [child.to_ir() for child in self.children],
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
        Render the layer as an anywidget for Jupyter notebooks.

        Args:
            w: Chart width in pixels
            h: Chart height in pixels
            axes: Whether to show axes
            debug: Whether to enable debug mode

        Returns:
            GoFishChartWidget instance that will display in Jupyter
        """
        import base64
        import json
        from .widget import GoFishChartWidget
        from .arrow_utils import dataframe_to_arrow
        import pandas as pd
        import pyarrow as pa

        def _serialize_child_data(child: ChartBuilder) -> str:
            """Serialize a child chart's data to base64 Arrow bytes."""
            if isinstance(child.data, LayerSelector):
                schema = pa.schema([pa.field("_placeholder", pa.int32())])
                table = pa.Table.from_arrays([], schema=schema)
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, schema) as writer:
                    writer.write_table(table)
                return base64.b64encode(sink.getvalue().to_pybytes()).decode("ascii")

            if isinstance(child.data, pd.DataFrame):
                df = child.data
            elif child.data is None:
                df = pd.DataFrame()
            else:
                df = pd.DataFrame(child.data)

            if len(df) == 0:
                schema = pa.schema([pa.field("_placeholder", pa.int32())])
                table = pa.Table.from_arrays([], schema=schema)
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, schema) as writer:
                    writer.write_table(table)
                return base64.b64encode(sink.getvalue().to_pybytes()).decode("ascii")

            return base64.b64encode(dataframe_to_arrow(df)).decode("ascii")

        # Serialize each child's data and collect derive functions
        arrow_dict: dict = {}
        derive_functions: dict = {}
        for i, child in enumerate(self.children):
            arrow_dict[str(i)] = _serialize_child_data(child)
            for op in child.operators:
                if isinstance(op, DeriveOperator):
                    derive_functions[op.lambda_id] = op.fn

        arrow_data = json.dumps(arrow_dict)
        spec = self.to_ir()

        widget = GoFishChartWidget(
            spec=spec,
            arrow_data=arrow_data,
            derive_functions=derive_functions,
            width=w,
            height=h,
            axes=axes,
            debug=debug,
        )
        return widget


def Layer(
    children_or_options: Union[List[ChartBuilder], dict],
    children: Optional[List[ChartBuilder]] = None,
) -> LayerBuilder:
    """
    Compose multiple ChartBuilder instances as a layered chart.

    Two calling conventions:
        Layer([chart1, chart2])
        Layer({"coord": clock()}, [chart1, chart2])

    Args:
        children_or_options: List of ChartBuilders, or options dict
        children: List of ChartBuilders (when first arg is options dict)

    Returns:
        LayerBuilder instance
    """
    if isinstance(children_or_options, list):
        return LayerBuilder(children_or_options)
    else:
        return LayerBuilder(children or [], children_or_options)
