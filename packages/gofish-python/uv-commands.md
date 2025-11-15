# uv Commands Cheat Sheet

Quick reference for common `uv` commands when working with gofish-graphics.

## Installation & Setup

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync all dependencies (creates/updates uv.lock)
uv sync

# Sync with specific extras
uv sync --extra pythonmonkey --extra dev
```

## Development

```bash
# Run a command in the project environment
uv run pytest
uv run black gofish_python/
uv run mypy gofish_python/

# Add a new dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Remove a dependency
uv remove package-name
```

## Building

```bash
# Build source distribution and wheel
uv build

# Clean before building
rm -rf dist/ build/ *.egg-info
uv build
```

## Publishing

```bash
# Publish to PyPI
uv publish

# Publish to TestPyPI
uv publish --publish-url https://test.pypi.org/legacy/
```

## Virtual Environments

```bash
# Create a virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Run commands in venv
uv run python script.py
```

## Package Management

```bash
# Install package locally
uv pip install -e .

# Install from local build
uv pip install dist/gofish-graphics-0.1.0-py3-none-any.whl

# Install from PyPI
uv pip install gofish-graphics

# Install with extras
uv pip install "gofish-graphics[pythonmonkey,jupyter]"
```

## Information

```bash
# Show project info
uv pip list

# Show installed packages
uv pip list

# Show package info
uv pip show gofish-graphics
```

## Tips

- `uv sync` automatically creates/updates `uv.lock` based on `pyproject.toml`
- Use `uv run` to run commands in the project environment
- `uv build` is faster than `pip wheel` or `python setup.py bdist_wheel`
- `uv publish` combines build + upload in one command
