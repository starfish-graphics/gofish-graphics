"""AnyWidget-based chart rendering for GoFish."""

import base64
import uuid
from pathlib import Path
from typing import Any, Dict

import anywidget
import traitlets

from .arrow_utils import dataframe_to_arrow


class GoFishChartWidget(anywidget.AnyWidget):
    """Widget for rendering GoFish charts from JSON specifications."""

    # Traitlets for chart configuration
    spec = traitlets.Dict().tag(sync=True)
    arrow_data = traitlets.Unicode().tag(sync=True)  # Base64-encoded Arrow data
    width = traitlets.Int(800).tag(sync=True)
    height = traitlets.Int(600).tag(sync=True)
    axes = traitlets.Bool(False).tag(sync=True)
    debug = traitlets.Bool(False).tag(sync=True)
    container_id = traitlets.Unicode().tag(sync=True)

    def __init__(
        self,
        spec: Dict[str, Any],
        arrow_data: bytes,
        width: int = 800,
        height: int = 600,
        axes: bool = False,
        debug: bool = False,
        **kwargs,
    ):
        """Initialize the GoFish chart widget.

        Args:
            spec: Chart specification (operators, mark, options)
            arrow_data: Initial data as Arrow bytes
            width: Chart width
            height: Chart height
            axes: Whether to show axes
            debug: Whether to enable debug mode
            **kwargs: Additional widget arguments
        """
        # Generate unique container ID
        container_id = f"gofish-chart-{uuid.uuid4().hex[:8]}"

        # Load the self-contained widget bundle
        # The bundle includes all dependencies (gofish-graphics, solid-js, apache-arrow)
        # and requires no network access or import maps
        bundle_path = Path(__file__).parent / "_static" / "widget.esm.js"

        if not bundle_path.exists():
            raise FileNotFoundError(
                f"Widget bundle not found at {bundle_path}.\n"
                f"This package requires the widget bundle to be built and included in the package.\n"
                f"Please build the widget bundle:\n"
                f"  cd packages/gofish-python-2 && pnpm build:widget\n"
                f"Or ensure the bundle exists at: {bundle_path}\n"
                f"If installing from PyPI, this should be included automatically. "
                f"If installing from source, ensure the build step runs."
            )

        # Load the bundled ESM code
        with open(bundle_path, "r", encoding="utf-8") as f:
            esm_code = f.read()

        # Encode Arrow data as base64 for transmission to JS
        arrow_data_b64 = base64.b64encode(arrow_data).decode("utf-8")

        super().__init__(
            _esm=esm_code,
            spec=spec,
            arrow_data=arrow_data_b64,
            width=width,
            height=height,
            axes=axes,
            debug=debug,
            container_id=container_id,
            **kwargs,
        )
