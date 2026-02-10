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

# Build contributor callout guidance from PR data
# Expected PR blocks look like:
# - "### PR #123: Title"
# - "- **Author:** username"
# - "- **URL:** https://..."
CONTRIBUTOR_CALLOUTS=$(
  awk '
    /^### PR #[0-9]+:/ {
      line = $0
      sub(/^### PR #/, "", line)
      split(line, parts, ": ")
      pr = parts[1]
      title = substr(line, length(pr) + 3)
    }
    /^- \*\*Author:\*\* / {
      author = $0
      sub(/^- \*\*Author:\*\* /, "", author)
    }
    /^- \*\*URL:\*\* / {
      url = $0
      sub(/^- \*\*URL:\*\* /, "", url)
      if (author != "" && !(author in seen)) {
        seen[author] = 1
        firstPr[author] = pr
        firstTitle[author] = title
        firstUrl[author] = url
      }
      author = ""
      pr = ""
      title = ""
      url = ""
    }
    END {
      for (a in seen) {
        printf("- %s: <%s|PR #%s> - %s\n", a, firstUrl[a], firstPr[a], firstTitle[a])
      }
    }
  ' prs.txt | sort
)

if [ -z "$CONTRIBUTOR_CALLOUTS" ]; then
  CONTRIBUTOR_CALLOUTS="(No named contributors detected.)"
fi

# Count merged PRs to include in Highlights.
PR_COUNT=$(grep -c '^### PR #' prs.txt || true)

# Build the prompt template
read -r -d '' PROMPT_TEMPLATE <<'ENDPROMPT' || true
You are summarizing a week of development on GoFish, a charting library for data visualization. Create a Slack-friendly weekly update.

## Merged PRs from the last 7 days:
PRS_PLACEHOLDER

## Weekly PR count:
PR_COUNT_PLACEHOLDER

## Contributor coverage requirements (MUST follow):
CONTRIBUTOR_CALLOUTS_PLACEHOLDER

Write a concise weekly summary using Slack mrkdwn format (NOT standard Markdown):
- Use *single asterisks* for bold (Slack does NOT support **double asterisks**)
- Use *Section Name* for section headers (Slack does NOT support # or ## headers)
- Use • or - for bullet points
- Use _underscores_ for italics if needed
- When mentioning any PR in the summary, format it as a hyperlink using the URL from the data above: <PR_URL|PR #NUMBER> (e.g. <https://github.com/starfish-graphics/gofish-graphics/pull/123|PR #123>)
- Contributor coverage is REQUIRED: every contributor listed above must be called out by name with at least one specific contribution.
- In *Highlights*, explicitly mention the number of PRs that landed this week using the PR count above.

Structure your response as:
1. *Highlights* - 2-3 sentence overview of the main thrust of work this week
2. *What changed* - Group related changes by theme (e.g., "API improvements", "Bug fixes", "Documentation"). Use bullet points, keep each brief.
3. *Contributor shout-outs* - One bullet per contributor, each explicitly naming the person and one concrete contribution (preferably linked PR).

Keep the tone casual and informative. Use emoji sparingly. Total length should be readable in ~30 seconds.
ENDPROMPT

# Read data from file (avoids escaping issues with GitHub Actions outputs)
PRS_DATA=$(cat prs.txt)

PROMPT="${PROMPT_TEMPLATE//PRS_PLACEHOLDER/$PRS_DATA}"
PROMPT="${PROMPT//PR_COUNT_PLACEHOLDER/$PR_COUNT}"
PROMPT="${PROMPT//CONTRIBUTOR_CALLOUTS_PLACEHOLDER/$CONTRIBUTOR_CALLOUTS}"

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set"
  exit 1
fi

# Call Claude API - use jq to build payload for proper escaping
PAYLOAD=$(jq -n \
  --arg prompt "$PROMPT" \
  '{
    "model": "claude-opus-4-6",
    "max_tokens": 2048,
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

# Guarantee each contributor appears by name at least once.
MISSING_CALLOUTS=$(
  awk '
    /^### PR #[0-9]+:/ {
      line = $0
      sub(/^### PR #/, "", line)
      split(line, parts, ": ")
      pr = parts[1]
      title = substr(line, length(pr) + 3)
    }
    /^- \*\*Author:\*\* / {
      author = $0
      sub(/^- \*\*Author:\*\* /, "", author)
    }
    /^- \*\*URL:\*\* / {
      url = $0
      sub(/^- \*\*URL:\*\* /, "", url)
      if (author != "" && !(author in seen)) {
        seen[author] = 1
        firstPr[author] = pr
        firstTitle[author] = title
        firstUrl[author] = url
      }
      author = ""
      pr = ""
      title = ""
      url = ""
    }
    END {
      for (a in seen) {
        print a "\t" firstPr[a] "\t" firstUrl[a] "\t" firstTitle[a]
      }
    }
  ' prs.txt | sort | while IFS=$'\t' read -r author pr url title; do
    if ! grep -iqE "(^|[^[:alnum:]_])${author}([^[:alnum:]_]|$)" <<< "$SUMMARY"; then
      printf -- "- %s: Shipped %s (%s).\n" "$author" "<${url}|PR #${pr}>" "$title"
    fi
  done
)

if [ -n "$MISSING_CALLOUTS" ]; then
  SUMMARY="${SUMMARY}

*Contributor shout-outs (added for full coverage)*
${MISSING_CALLOUTS}"
fi

# Save to file to avoid escaping issues
echo "$SUMMARY" > summary.txt

echo "Summary generated successfully!"
cat summary.txt
