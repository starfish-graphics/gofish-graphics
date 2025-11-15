# Publishing Guide for GoFish Python

This guide explains how to publish the `gofish-graphics` package to PyPI using `uv`.

## Prerequisites

1. **Install uv**: https://github.com/astral-sh/uv
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   # or
   pip install uv
   ```

2. **PyPI Account**: Create an account at https://pypi.org/account/register/

3. **API Token**: Generate an API token at https://pypi.org/manage/account/token/

## Setup

### 1. Configure PyPI Credentials

Store your PyPI credentials using `uv`:

```bash
# For production PyPI
uv pip config set global.index-url https://pypi.org/simple

# Add your API token (uv uses standard pip configuration)
# Create/edit ~/.pypirc or use environment variables:
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-your-api-token-here
```

Or use `keyring` for secure credential storage:

```bash
pip install keyring
keyring set https://upload.pypi.org/legacy/ __token__
# Enter your PyPI API token when prompted
```

### 2. Install Build Dependencies

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync project dependencies (creates/updates uv.lock)
cd packages/gofish-python
uv sync
```

## Publishing Process

### 1. Update Version

Edit `pyproject.toml` to update the version:

```toml
[project]
version = "0.1.0"  # Update to new version
```

Or use `uv` to bump version (if using a version tool):

```bash
# Manual: Edit pyproject.toml
# Or use a tool like bump2version or commitizen
```

### 2. Build Distribution

```bash
# Clean previous builds
rm -rf dist/ build/ *.egg-info

# Build source distribution and wheel using uv
uv build
```

This will create:
- `dist/gofish-graphics-0.1.0.tar.gz` (source distribution)
- `dist/gofish-graphics-0.1.0-py3-none-any.whl` (wheel)

### 3. Verify Build

```bash
# Check the built files
ls -lh dist/

# Test install from local build
uv pip install dist/gofish-graphics-0.1.0-py3-none-any.whl

# Test in a clean environment
uv venv test-env
source test-env/bin/activate  # or `test-env\Scripts\activate` on Windows
uv pip install dist/gofish-graphics-0.1.0-py3-none-any.whl
python -c "import gofish_python; print(gofish_python.__version__)"
```

### 4. Publish to PyPI

#### Option A: Using uv (Recommended)

```bash
# Publish to production PyPI
uv publish

# Or publish to TestPyPI first
uv publish --publish-url https://test.pypi.org/legacy/
```

#### Option B: Using twine (Alternative)

```bash
# Install twine
uv pip install twine

# Upload to TestPyPI (for testing)
twine upload --repository testpypi dist/*

# Upload to production PyPI
twine upload dist/*
```

#### Option C: Using uv pip install --publish (if supported)

```bash
uv pip install --publish dist/gofish-graphics-0.1.0-py3-none-any.whl
```

### 5. Verify Publication

```bash
# Wait a few minutes for PyPI to update
# Then test install from PyPI
uv venv verify-env
source verify-env/bin/activate
uv pip install gofish-graphics
python -c "import gofish_python; print(gofish_python.__version__)"
```

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Bumping

```bash
# Edit pyproject.toml manually
# Or use a tool like:
pip install bump2version
bump2version patch  # or minor, major

# Or use commitizen:
pip install commitizen
cz bump
```

## Workflow Summary

```bash
# 1. Update version in pyproject.toml
vim pyproject.toml  # Change version

# 2. Update CHANGELOG.md (if you have one)
vim CHANGELOG.md

# 3. Commit changes
git add pyproject.toml CHANGELOG.md
git commit -m "Bump version to 0.1.0"

# 4. Tag the release
git tag v0.1.0
git push origin main --tags

# 5. Build
uv build

# 6. Test build
uv pip install dist/gofish-graphics-0.1.0-py3-none-any.whl

# 7. Publish
uv publish

# 8. Verify
uv pip install gofish-graphics
```

## TestPyPI (Testing Before Production)

Always test on TestPyPI first:

```bash
# 1. Create TestPyPI account: https://test.pypi.org/account/register/
# 2. Get TestPyPI API token: https://test.pypi.org/manage/account/token/

# 3. Publish to TestPyPI
uv publish --publish-url https://test.pypi.org/legacy/

# 4. Test install from TestPyPI
uv pip install --index-url https://test.pypi.org/simple/ gofish-graphics
```

## Troubleshooting

### Error: "Package already exists"

- Version already published. Bump version and try again.

### Error: "Invalid credentials"

- Check your API token is correct
- Ensure `__token__` is used as username for API tokens
- Verify token has upload permissions

### Error: "Missing required fields"

- Ensure `pyproject.toml` has all required `[project]` fields
- Check `README.md` exists if specified
- Verify classifiers and metadata

### Build fails

```bash
# Ensure build dependencies are installed
uv sync --extra dev

# Check for syntax errors
python -m py_compile gofish_python/**/*.py
```

## Automated Publishing (CI/CD)

See `.github/workflows/publish-python.yml` for automated publishing setup.

## Post-Publishing

1. **GitHub Release**: Create a release on GitHub with release notes
2. **Documentation**: Update documentation if needed
3. **Announcement**: Announce on relevant channels (if applicable)

## Notes

- PyPI has rate limits (200 requests/hour for API)
- Wait a few minutes after publishing before verifying
- Keep `dist/` in `.gitignore` (already configured)
- Never commit API tokens or credentials
