"""AnyWidget-based chart rendering for GoFish."""

import base64
import uuid
from pathlib import Path
from typing import Any, Callable, Dict, Optional

import anywidget
import traitlets

from .arrow_utils import arrow_to_dataframe, dataframe_to_arrow


class GoFishChartWidget(anywidget.AnyWidget):
    """Widget for rendering GoFish charts from JSON specifications."""

    # Traitlets for chart configuration
    spec = traitlets.Dict().tag(sync=True)
    arrow_data = traitlets.Unicode().tag(sync=True)  # Base64-encoded Arrow data
    derive_functions = traitlets.Dict().tag(sync=False)  # Python-only registry
    executeDerive = traitlets.Any().tag(sync=False)  # RPC hook callable
    width = traitlets.Int(800).tag(sync=True)
    height = traitlets.Int(600).tag(sync=True)
    axes = traitlets.Bool(False).tag(sync=True)
    debug = traitlets.Bool(False).tag(sync=True)
    container_id = traitlets.Unicode().tag(sync=True)

    def __init__(
        self,
        spec: Dict[str, Any],
        arrow_data: bytes,
        derive_functions: Optional[Dict[str, Callable]] = None,
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
            derive_functions: Map of lambda_id -> Python callable for derive
            **kwargs: Additional widget arguments
        """
        # Generate unique container ID
        container_id = f"gofish-chart-{uuid.uuid4().hex[:8]}"

        # Store derive registry locally (not synced to the frontend)
        self.derive_functions = derive_functions or {}

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

        # Handle RPC-style messages from the front-end
        self.on_msg(self._handle_custom_msg)

    @traitlets.default("executeDerive")
    def _execute_derive(self):
        """Execute a derive function and return Arrow data as base64."""

        def execute(lambda_id: str, arrow_data_b64: str) -> str:
            # Locate Python function for this lambda_id
            fn = self.derive_functions.get(lambda_id)
            if fn is None:
                raise ValueError(f"Derive function with ID {lambda_id} not found")

            # Decode Arrow to DataFrame
            arrow_bytes = base64.b64decode(arrow_data_b64)
            df = arrow_to_dataframe(arrow_bytes)

            # Execute user function
            result = fn(df)

            # Normalize result to DataFrame
            try:
                import pandas as pd
            except Exception as exc:  # pragma: no cover - import guard
                raise RuntimeError("pandas is required for derive execution") from exc

            if result is None:
                result_df = pd.DataFrame()
            elif isinstance(result, pd.DataFrame):
                result_df = result
            else:
                result_df = pd.DataFrame(result)

            # Encode result back to Arrow base64
            result_arrow = dataframe_to_arrow(result_df)
            return base64.b64encode(result_arrow).decode("utf-8")

        return execute

    def _handle_custom_msg(self, _, content: dict, buffers):
        """Handle custom messages from the front-end for RPC invocations."""
        # Expected shape: { "uuid": "...", "payload": { "type": "executeDerive", ... } }
        uuid = content.get("uuid")
        payload = content.get("payload", {})

        if not uuid or not isinstance(payload, dict):
            return

        if payload.get("type") != "executeDerive":
            return

        try:
            lambda_id = payload.get("lambdaId")
            arrow_b64 = payload.get("arrowB64")
            result_b64 = self.executeDerive(lambda_id, arrow_b64)
            self.send({"uuid": uuid, "payload": {"resultB64": result_b64}})
        except Exception as exc:  # pragma: no cover - defensive
            self.send(
                {
                    "uuid": uuid,
                    "error": f"executeDerive failed: {exc}",
                }
            )
