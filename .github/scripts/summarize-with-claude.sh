#!/bin/bash
set -e

# Script to generate a weekly summary using Claude API
# Expects prs.txt to exist in the current directory
# Outputs summary to summary.txt

# Check if required file exists
if [ ! -f prs.txt ]; then
  echo "ERROR: prs.txt must exist in the current directory"
  echo "This file should be created by previous workflow steps"
  exit 1
fi

# Build the prompt
PROMPT=$(cat <<'ENDPROMPT'
You are summarizing a week of development on GoFish, a charting library for data visualization. Create a Slack-friendly weekly update.

## Merged PRs from the last 7 days:
PRS_PLACEHOLDER

Write a concise weekly summary using Slack mrkdwn format (NOT standard Markdown):
- Use *single asterisks* for bold (Slack does NOT support **double asterisks**)
- Use *Section Name* for section headers (Slack does NOT support # or ## headers)
- Use • or - for bullet points
- Use _underscores_ for italics if needed
- When mentioning any PR in the summary, format it as a hyperlink using the URL from the data above: <PR_URL|PR #NUMBER> (e.g. <https://github.com/starfish-graphics/gofish-graphics/pull/123|PR #123>)

Structure your response as:
1. *Highlights* - 2-3 sentence overview of the main thrust of work this week
2. *What changed* - Group related changes by theme (e.g., "API improvements", "Bug fixes", "Documentation"). Use bullet points, keep each brief.
3. *PRs of note* - Call out any significant PRs with a one-liner each

Keep the tone casual and informative. Use emoji sparingly. Total length should be readable in ~30 seconds.
ENDPROMPT
)

# Read data from file (avoids escaping issues with GitHub Actions outputs)
PRS_DATA=$(cat prs.txt)

PROMPT="${PROMPT//PRS_PLACEHOLDER/$PRS_DATA}"

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set"
  exit 1
fi

# Call Claude API - use jq to build payload for proper escaping
PAYLOAD=$(jq -n \
  --arg prompt "$PROMPT" \
  '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": $prompt}]
  }'
)

RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d "$PAYLOAD")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error from Claude API:"
  echo "$RESPONSE" | jq -r '.error'
  exit 1
fi

SUMMARY=$(echo "$RESPONSE" | jq -r '.content[0].text // "Failed to generate summary"' || echo "Failed to generate summary")

if [ -z "$SUMMARY" ] || [ "$SUMMARY" = "Failed to generate summary" ]; then
  echo "Failed to extract summary from API response"
  echo "Response: $RESPONSE"
  exit 1
fi

# Save to file to avoid escaping issues
echo "$SUMMARY" > summary.txt

echo "Summary generated successfully!"
cat summary.txt
