#!/bin/bash
# Script to run the test notebook with the uv environment

cd "$(dirname "$0")"
source .venv/bin/activate

# Register the kernel if needed
python -m ipykernel install --user --name=gofish-python --display-name "Python (GoFish)"

# Launch Jupyter
jupyter notebook tests/test_notebook.ipynb


