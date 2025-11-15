# Development Notes

## Known Issues

### jsbridge Build Issues

The `jsbridge` package has known build issues and may fail to install. **Use `pythonmonkey` instead**, which is recommended and more reliable.

To install with pythonmonkey:
```bash
uv sync --group dev --extra pythonmonkey
# or
uv pip install pythonmonkey
```

Avoid using the `jspybridge` extra until jsbridge is fixed or we find an alternative.

## uv Sync Command

When using `uv sync`:

- **With dev dependencies**: `uv sync --group dev`
- **Without dev dependencies**: `uv sync`
- **With JavaScript bridge**: `uv sync --extra pythonmonkey`
- **Combined**: `uv sync --group dev --extra pythonmonkey`

The `--group dev` flag installs development dependencies (pytest, black, mypy).
The `--extra` flag installs optional runtime dependencies.

## Dependency Groups vs Optional Dependencies

- **`[dependency-groups]`**: For development dependencies (pytest, black, etc.)
- **`[project.optional-dependencies]`**: For optional runtime dependencies (pythonmonkey, jupyter, etc.)

This follows uv's recommended pattern.


