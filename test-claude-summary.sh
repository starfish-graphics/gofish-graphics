#!/bin/bash
# Test script for summarize-with-claude.sh
# Creates mock data files and then calls the real script

set -e

# Create mock data file
echo "### PR #123: Fix important bug
- **Author:** johndoe
- **Merged:** 2025-01-10
- **URL:** https://github.com/example/repo/pull/123
- **Description:** Fixed a critical bug in the rendering engine

### PR #124: Add new feature
- **Author:** janesmith
- **Merged:** 2025-01-11
- **URL:** https://github.com/example/repo/pull/124
- **Description:** Added support for new chart types" > prs.txt

# Call the real script
bash .github/scripts/summarize-with-claude.sh

# Clean up mock files (optional - comment out if you want to keep them)
# rm -f prs.txt summary.txt
