# Quick Start Guide - Publishing to PyPI with uv

## Prerequisites

1. **Install uv**: https://github.com/astral-sh/uv
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **PyPI Account & Token**:
   - Create account: https://pypi.org/account/register/
   - Create API token: https://pypi.org/manage/account/token/
   - Save token securely

## Quick Publishing Steps

```bash
# 1. Navigate to package directory
cd packages/gofish-python

# 2. Update version in pyproject.toml
# Edit: version = "0.1.1"  # Increment version

# 3. Sync dependencies (creates/updates uv.lock)
uv sync

# 4. Build distribution
uv build

# 5. Test build locally (optional)
uv venv test-env
source test-env/bin/activate
uv pip install dist/gofish-graphics-0.1.1-py3-none-any.whl
python -c "import gofish_python; print(gofish_python.__version__)"
deactivate

# 6. Configure PyPI credentials (first time only)
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-your-api-token-here

# 7. Publish to TestPyPI first (recommended)
uv publish --publish-url https://test.pypi.org/legacy/

# 8. Test from TestPyPI
uv venv verify-env
source verify-env/bin/activate
uv pip install --index-url https://test.pypi.org/simple/ gofish-graphics
deactivate

# 9. Publish to production PyPI
uv publish

# 10. Verify publication (wait a few minutes)
uv venv final-verify
source final-verify/bin/activate
uv pip install gofish-graphics
deactivate
```

## Using Makefile

```bash
# Build
make build

# Publish to PyPI
make publish

# Publish to TestPyPI
make testpypi

# Clean build artifacts
make clean

# Show version
make version
```

## Troubleshooting

### First Time Publishing

```bash
# Set credentials
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-your-token-here

# Or use keyring
pip install keyring
keyring set https://upload.pypi.org/legacy/ __token__
```

### Version Already Exists

```bash
# Bump version in pyproject.toml
# Then rebuild and republish
uv build
uv publish
```

### Build Fails

```bash
# Ensure dependencies are synced
uv sync

# Check for syntax errors
python -m py_compile gofish_python/**/*.py
```

## Full Documentation

See [PUBLISHING.md](PUBLISHING.md) for complete details.

