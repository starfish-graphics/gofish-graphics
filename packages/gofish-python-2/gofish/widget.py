"""AnyWidget-based chart rendering for GoFish."""

import base64
import json
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

import anywidget
import traitlets

from .arrow_utils import dataframe_to_arrow


def find_local_gofish_build() -> Optional[Path]:
    """
    Find the path to the local gofish-graphics build.

    Looks for packages/gofish-graphics/dist/index.js relative to this package.

    Returns:
        Path to the build file (ESM format) or None if not found
    """
    # Try to find local gofish-graphics build
    # This package is at packages/gofish-python-2/gofish/
    # So we need to go up to packages/gofish-graphics/dist/index.js
    current_file = Path(__file__).resolve()
    # Go up: gofish -> gofish-python-2 -> packages/
    # Then into packages/gofish-graphics/dist/index.js
    gofish_graphics_path = (
        current_file.parent.parent.parent  # packages/
        / "gofish-graphics"
        / "dist"
        / "index.js"
    )
    if gofish_graphics_path.exists():
        return gofish_graphics_path

    return None


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

        # Check if we have a local gofish-graphics build
        # This package requires a local build and will NEVER pull gofish from the internet
        gofish_build_path = find_local_gofish_build()

        # Calculate expected path for error message
        current_file = Path(__file__).resolve()
        expected_path = (
            current_file.parent.parent.parent  # packages/
            / "gofish-graphics"
            / "dist"
            / "index.js"
        )

        if not gofish_build_path or not gofish_build_path.exists():
            raise FileNotFoundError(
                f"Local gofish-graphics build not found at {expected_path}.\n"
                f"This package requires a local build of gofish-graphics and will NOT pull from the internet.\n"
                f"Please build gofish-graphics locally:\n"
                f"  cd packages/gofish-graphics && pnpm build\n"
                f"Or ensure the build exists at: {expected_path}"
            )

        # Use local build - create a data URL for the gofish-graphics build
        with open(gofish_build_path, "r", encoding="utf-8") as f:
            gofish_content = f.read()

        # Create a data URL for the gofish-graphics build
        gofish_data_url = f"data:text/javascript;base64,{base64.b64encode(gofish_content.encode('utf-8')).decode('utf-8')}"

        bundle_import = (
            "// Load local gofish-graphics build (NEVER from internet)\n"
            f"const gofishModule = await import({json.dumps(gofish_data_url)});\n"
            "\n"
            "// Load solid-js and apache-arrow\n"
            "// Set up import map for solid-js (required peer dependency)\n"
            "if (!document.querySelector('script[type=\"importmap\"]')) {\n"
            "  const importMap = document.createElement('script');\n"
            "  importMap.type = 'importmap';\n"
            "  importMap.textContent = JSON.stringify({\n"
            '    "imports": {\n'
            '      "solid-js": "https://esm.sh/solid-js@latest",\n'
            '      "apache-arrow": "https://esm.sh/apache-arrow@latest"\n'
            "    }\n"
            "  });\n"
            "  document.head.insertBefore(importMap, document.head.firstChild);\n"
            "  // Wait for import map to be processed\n"
            "  await new Promise(resolve => setTimeout(resolve, 100));\n"
            "}\n"
            "\n"
            "const [solidModule, arrowModule] = await Promise.all([\n"
            "  import('https://esm.sh/solid-js@latest'),\n"
            "  import('https://esm.sh/apache-arrow@latest')\n"
            "]);\n"
        )
        extract_modules = """
          // Extract createResource and createSignal from solid-js
          const createResource = solidModule.createResource;
          const createSignal = solidModule.createSignal;
          
          // gofishModule is already loaded as gofishModule
          // arrowModule is already loaded
        """

        # Load ESM module code from JavaScript file
        widget_js_path = Path(__file__).parent / "widget.js"
        with open(widget_js_path, "r", encoding="utf-8") as f:
            esm_code = f.read()

        # Replace template placeholders with actual code
        esm_code = esm_code.replace("{BUNDLE_IMPORT}", bundle_import)
        esm_code = esm_code.replace("{EXTRACT_MODULES}", extract_modules)

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
