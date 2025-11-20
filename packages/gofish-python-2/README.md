# gofish-python-2

A clean, minimal implementation of the AST portion for GoFish graphics library. This package focuses solely on converting Python syntax to a JSON Intermediate Representation (IR).

**Note**: This package uses [uv](https://github.com/astral-sh/uv) for fast package management and testing.

## Features

- **AST Classes**: ChartBuilder, operators (spread, stack, derive, group, scatter), and marks (rect, circle, line, area, scaffold)
- **IR Serialization**: Convert Python chart specifications to JSON IR
- **No Dependencies**: Pure Python, no external dependencies required
- **Comprehensive Tests**: Full test coverage for AST to IR conversion

## Installation

This package uses [uv](https://github.com/astral-sh/uv) for fast package management.

```bash
cd packages/gofish-python-2
uv pip install -e .
```

## Usage

```python
from gofish import chart, spread, stack, rect

# Create a chart specification
data = [{"lake": "A", "species": "B", "count": 10}]
c = (
    chart(data, options={"w": 800, "h": 600})
    .flow(
        spread("lake", dir="x", spacing=64),
        stack("species", dir="y", spacing=0),
    )
    .mark(rect(h="count", fill="species"))
)

# Convert to JSON IR
ir = c.to_ir()
print(ir)
# {
#     "data": None,
#     "operators": [
#         {"type": "spread", "field": "lake", "dir": "x", "spacing": 64},
#         {"type": "stack", "field": "species", "dir": "y", "spacing": 0}
#     ],
#     "mark": {"type": "rect", "h": "count", "fill": "species"},
#     "options": {"w": 800, "h": 600}
# }
```

## IR Format

The JSON IR has the following structure:

```json
{
  "data": null,
  "operators": [
    { "type": "spread", "field": "lake", "dir": "x", "spacing": 8 },
    { "type": "derive", "lambdaId": "uuid-here" },
    { "type": "stack", "field": "species", "dir": "y" }
  ],
  "mark": { "type": "rect", "h": "count", "fill": "species" },
  "options": {}
}
```

## Running Tests

```bash
# Install with test dependencies
uv pip install -e ".[test]"

# Run tests
uv run pytest

# Or run directly if installed
pytest
```

## What's Not Included

This package intentionally excludes:

- Rendering (no widgets, no HTML generation)
- Data marshaling (no Arrow, no DataFrame handling)
- Jupyter integration
- JavaScript bridge

These concerns are handled separately in the full implementation.
