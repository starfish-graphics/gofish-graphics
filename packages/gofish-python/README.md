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
- Node.js (for rendering charts)
- pyarrow
- pandas


