#!/bin/bash
# check-python-sync.sh
#
# Ensure that when a JS story changes in a PR, the corresponding Python
# story is also updated (unless it's in the exempt list).
#
# Usage:  bash scripts/check-python-sync.sh [base-branch]
#         base-branch defaults to "origin/main"

set -euo pipefail

BASE_BRANCH="${1:-origin/main}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TESTS_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_DIR="$(dirname "$TESTS_DIR")"
EXEMPT_FILE="$TESTS_DIR/.python-sync-exempt"

# Map JS story file path to expected Python test file path
# e.g. "packages/gofish-graphics/stories/forwardsyntax/Bar/BarBasic.stories.tsx"
#   →  "tests/python-stories/forwardsyntax/test_bar_basic.py"
map_js_to_python() {
  local js_file="$1"

  # Strip prefix and suffix
  local rel="${js_file#packages/gofish-graphics/stories/}"
  rel="${rel%.stories.tsx}"

  # Convert to snake_case path
  # Split on "/"
  local dir_part=$(dirname "$rel")
  local base_part=$(basename "$rel")

  # Convert CamelCase to snake_case
  local snake_base=$(echo "$base_part" | sed -E 's/([a-z])([A-Z])/\1_\2/g' | tr '[:upper:]' '[:lower:]')

  # Convert dir segments similarly
  local snake_dir=$(echo "$dir_part" | sed -E 's/([a-z])([A-Z])/\1_\2/g' | tr '[:upper:]' '[:lower:]' | tr '/' '/')

  # Handle nested dirs like "Bar/BarBasic" → just "test_bar_basic" in parent dir
  # The Python stories flatten the Bar/ subdirectory
  if [[ "$snake_dir" == *"/"* ]]; then
    # e.g. "forwardsyntax/bar" → "forwardsyntax"
    snake_dir=$(echo "$snake_dir" | sed 's|/[^/]*$||')
  fi

  echo "tests/python-stories/${snake_dir}/test_${snake_base}.py"
}

# Get JS story files changed in this PR
changed_js=$(git diff --name-only "$BASE_BRANCH"...HEAD -- 'packages/gofish-graphics/stories/**/*.stories.tsx' 2>/dev/null || true)

if [ -z "$changed_js" ]; then
  echo "No JS story files changed. Python sync check passed."
  exit 0
fi

errors=0

while IFS= read -r js_file; do
  [ -z "$js_file" ] && continue

  # Check if exempt
  if [ -f "$EXEMPT_FILE" ] && grep -qF "$js_file" "$EXEMPT_FILE"; then
    echo "  EXEMPT: $js_file"
    continue
  fi

  python_file=$(map_js_to_python "$js_file")

  # Check if the Python file exists at all
  if [ ! -f "$ROOT_DIR/$python_file" ]; then
    echo "  WARNING: No Python equivalent for $js_file (expected $python_file)"
    # Not an error if Python file doesn't exist yet — only flag if it exists but wasn't updated
    continue
  fi

  # Check if Python file was also changed
  if ! git diff --name-only "$BASE_BRANCH"...HEAD | grep -qF "$python_file"; then
    echo "  ERROR: $js_file changed but $python_file was not updated"
    errors=$((errors + 1))
  else
    echo "  OK: $js_file ↔ $python_file"
  fi
done <<< "$changed_js"

if [ "$errors" -gt 0 ]; then
  echo ""
  echo "$errors Python story sync error(s). Update the Python stories to match JS changes."
  exit 1
fi

echo ""
echo "Python sync check passed."
