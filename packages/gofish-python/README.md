# GoFish Python

Python wrapper for the GoFish graphics library.

## Installation

```bash
pip install gofish-python
```

For Jupyter notebook support:

```bash
pip install gofish-python[jupyter]
```

## Usage

```python
import pandas as pd
from gofish import chart, spread, stack, derive, rect

# Load your data
seafood = pd.DataFrame({
    "lake": ["A", "B", "C"],
    "species": ["X", "Y", "Z"],
    "count": [10, 20, 30]
})

# Create a chart
(
    chart(seafood)
    .flow(
        spread("lake", dir="x", spacing=64),
        derive(lambda d: d.sort_values("count")),
        stack("species", dir="y", label=False)
    )
    .mark(rect(h="count", fill="species"))
    .render()
)
```

## Requirements

- Python 3.8+
- pyarrow
- pandas
- anywidget (for Jupyter support)

## Development / Building from Source

To build the Python package from source, you need to build the JavaScript bundles first:

```bash
# Build JavaScript assets (requires Node.js and npm)
python build_assets.py

# Then install the package
pip install -e .
```

The `build_assets.py` script will:
1. Build the `gofish-graphics` dependency (if needed)
2. Install JavaScript dependencies
3. Build the client bundle (`gofish-client.js` and `gofish-client.iife.js`)

**Note**: Pre-built bundles are included in the published package, so end users don't need Node.js installed.


