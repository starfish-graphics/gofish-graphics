.PHONY: help install build test clean publish testpypi version

help:
	@echo "Available commands:"
	@echo "  make install     - Install package in development mode with uv"
	@echo "  make build       - Build distribution packages"
	@echo "  make test        - Run tests"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make publish     - Publish to PyPI"
	@echo "  make testpypi    - Publish to TestPyPI"
	@echo "  make version     - Show current version"

install:
	uv sync

build:
	uv build

test:
	uv run pytest

clean:
	rm -rf dist/ build/ *.egg-info .pytest_cache .mypy_cache

publish: clean build
	uv publish

testpypi: clean build
	uv publish --publish-url https://test.pypi.org/legacy/

version:
	@python -c "import tomli; data = tomli.load(open('pyproject.toml', 'rb')); print(data['project']['version'])"
