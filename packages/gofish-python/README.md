# GoFish Python

Python wrapper for [GoFish Graphics](https://gofish.graphics/), a declarative charting library.

**Important:** JavaScript is the source of truth for all rendering, layout, and reactivity. This Python package provides a syntax-similar API that translates Python calls to JavaScript execution. All interactive and animated graphics are handled by SolidJS in JavaScript.

## Installation

### Using pip

```bash
# Install the package
pip install gofish-graphics

# Install a JavaScript bridge (choose one):
pip install pythonmonkey  # Recommended
# OR
pip install jsbridge
```

### Using uv (Recommended)

```bash
# Install uv: https://github.com/astral-sh/uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install the package
uv pip install gofish-graphics

# Install a JavaScript bridge (choose one):
uv pip install pythonmonkey  # Recommended
# OR
uv pip install jsbridge
```

You also need the GoFish JavaScript bundle. Either:

1. Install it as a sibling package in your monorepo
2. Set `GOFISH_JS_PATH` environment variable to the `dist` directory
3. The package will try to auto-detect it in common locations

## Quick Start

```python
from gofish import chart, spread, rect

# Data
alphabet = [
    {"letter": "A", "frequency": 28},
    {"letter": "B", "frequency": 55},
    {"letter": "C", "frequency": 43},
]

# Create chart (JavaScript executes all rendering)
chart(alphabet).flow(spread("letter", dir="x")).mark(rect(h="frequency")).render(w=500, h=300, axes=True)
```

## Architecture

### JavaScript as Source of Truth

This wrapper follows the same pattern as Plotly and Bokeh:

- **Python**: Provides the API, data, and configuration
- **JavaScript**: Handles all rendering, layout computation, and reactivity

All GoFish features work through JavaScript:

- SolidJS reactivity for animations
- Interactive graphics via DOM events
- Complex layouts and coordinate transforms
- SVG rendering

### How It Works

1. **Python API**: You write Python code with syntax similar to JS GoFish
2. **Translation**: Python calls are converted to JavaScript function calls
3. **Execution**: JavaScript (via bridge) executes GoFish code
4. **Rendering**: SolidJS renders interactive SVG to DOM or HTML

## Usage

### Basic Chart

```python
from gofish import chart, spread, rect

data = [{"x": 1, "y": 10}, {"x": 2, "y": 20}]

chart(data).flow(spread("x", dir="x")).mark(rect(h="y")).render(w=500, h=300)
```

### Stacked Bar Chart

```python
from gofish import chart, spread, stack, rect

chart(data).flow(
    spread("category", dir="x"),
    stack("series", dir="y")
).mark(rect(h="value", fill="series")).render(w=500, h=300, axes=True)
```

### With Pandas

```python
import pandas as pd
from gofish import chart, spread, rect

df = pd.DataFrame({
    "category": ["A", "B", "C"],
    "value": [10, 20, 30]
})

chart(df).flow(spread("category", dir="x")).mark(rect(h="value")).render()
```

### Jupyter Notebooks

```python
from gofish import chart, spread, rect, display_jupyter

node = chart(data).flow(spread("x", dir="x")).mark(rect(h="y"))
display_jupyter(node, w=500, h=300, axes=True)
```

**Test Notebook**: See `test_notebook.ipynb` for a comprehensive test notebook with examples.

## API Reference

### Core Functions

- `chart(data, **options)` - Create a new chart
- `ChartBuilder.flow(*operators)` - Add operators
- `ChartBuilder.mark(mark)` - Apply a mark
- `GoFishNode.render(**options)` - Render the chart

### Operators

- `spread(field, dir="x", ...)` - Spread groups
- `stack(field, dir="y", ...)` - Stack groups
- `scatter(field, x, y, ...)` - Scatter plot positioning
- `group(field)` - Group by field
- `derive(fn)` - Transform data
- `normalize(field)` - Normalize values
- `repeat(field)` - Repeat items
- `log(label)` - Debug logging

### Marks

- `rect(w, h, fill, ...)` - Rectangles
- `circle(r, fill, ...)` - Circles
- `line(stroke, ...)` - Lines
- `area(stroke, opacity, ...)` - Areas
- `scaffold(w, h, ...)` - Invisible guides
- `select(layer_name)` - Select from layer

## Development

### Setup with uv (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd packages/gofish-python

# Install uv: https://github.com/astral-sh/uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install in development mode with all dependencies
uv sync --group dev

# This installs:
# - Package in editable mode
# - Dev dependencies (pytest, black, mypy)
# - Optional dependencies available via extras

# To sync without dev dependencies:
uv sync

# To install with a JavaScript bridge:
uv sync --extra pythonmonkey  # Recommended
# Note: jsbridge has known build issues - use pythonmonkey instead
```

### Setup with pip (Alternative)

```bash
# Clone repository
git clone <repo-url>
cd packages/gofish-python

# Install in development mode
pip install -e ".[dev]"

# Install JavaScript bridge
pip install pythonmonkey
```

### Building GoFish JS Bundle

The Python wrapper needs the compiled GoFish JavaScript bundle:

```bash
# In packages/gofish-graphics
pnpm install
pnpm build
```

### Development Commands

```bash
# Run tests
uv run pytest
# or
make test

# Format code
uv run black gofish_python/

# Type checking
uv run mypy gofish_python/

# Build distribution
uv build
# or
make build

# Clean build artifacts
make clean
```

### Publishing

See [PUBLISHING.md](PUBLISHING.md) for detailed publishing instructions.

Quick version:

```bash
# 1. Update version in pyproject.toml
# 2. Build
uv build
# or
make build

# 3. Publish to PyPI
uv publish
# or
make publish

# Or test on TestPyPI first
make testpypi
```

## Limitations

1. **JavaScript Bridge Required**: You must install either `pythonmonkey` or `jsbridge`
2. **JS Bundle Required**: The GoFish JavaScript bundle must be available
3. **DOM Environment**: For interactive rendering, a DOM (browser/Jupyter) is needed
4. **Performance**: Python↔JavaScript interop has overhead; complex animations may be slower

## Future Work

- [ ] Better DOM-less rendering (static SVG export)
- [ ] Improved error messages
- [ ] Type hints and type checking
- [ ] More comprehensive examples
- [ ] Event handling from Python
- [ ] Animation control from Python

## License

MIT
