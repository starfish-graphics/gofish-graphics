# GoFish Python Setup

This document describes how to set up and run the GoFish Python wrapper.

## Prerequisites

- Python 3.8+
- Node.js (for rendering charts)
- `uv` (Python package manager)

## Setup Steps

### 1. Create Virtual Environment

```bash
cd packages/gofish-python
uv venv
```

### 2. Activate Virtual Environment

```bash
source .venv/bin/activate
```

### 3. Install Python Package

```bash
uv pip install -e ".[jupyter]"
```

This installs:
- The gofish-python package in editable mode
- All dependencies (pandas, pyarrow)
- Jupyter notebook support

### 4. Install Node.js Dependencies

```bash
cd gofish/js
npm install
cd ../..
```

This installs:
- GoFish graphics library (from the monorepo)
- Apache Arrow JavaScript library
- jsdom (for Node.js DOM simulation)
- SolidJS (peer dependency)

### 5. Run Test Notebook

Option A: Use the provided script
```bash
./run_notebook.sh
```

Option B: Manual launch
```bash
source .venv/bin/activate
jupyter notebook tests/test_notebook.ipynb
```

## Troubleshooting

### Node.js Not Found
Make sure Node.js is installed and in your PATH:
```bash
node --version
```

### Module Import Errors
Ensure the package is installed in editable mode:
```bash
uv pip install -e .
```

### GoFish Graphics Not Found (Node.js)
The Node.js bridge needs access to the GoFish graphics package. Make sure:
1. The monorepo is set up correctly
2. `gofish-graphics` is built: `cd ../../gofish-graphics && pnpm build`
3. The path in `gofish/js/package.json` is correct

## Environment Variables

No special environment variables are required. The package will:
- Automatically find Node.js in your PATH
- Use the virtual environment's Python interpreter
- Look for the GoFish graphics package relative to the monorepo structure


