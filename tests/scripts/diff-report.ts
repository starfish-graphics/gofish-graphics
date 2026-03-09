/**
 * Generate a self-contained HTML diff report for visual review.
 *
 * For each failing story (regression or parity), the report shows:
 *   - Side-by-side before/after screenshots (base64-embedded)
 *   - Unified text diff of the DOM snapshot
 *
 * Output: tests/tmp/diff-report.html
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "../..");
const BASELINE_DOM = join(ROOT, "__snapshots__/dom");
const BASELINE_SCREENSHOTS = join(ROOT, "__snapshots__/screenshots");
const JS_DIR = join(import.meta.dirname, "../tmp/js");
const PYTHON_DIR = join(import.meta.dirname, "../tmp/python");
const OUTPUT = join(import.meta.dirname, "../tmp/diff-report.html");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listHtmlFiles(dir: string, prefix = ""): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listHtmlFiles(join(dir, entry.name), rel));
    } else if (entry.name.endsWith(".html")) {
      results.push(rel);
    }
  }
  return results;
}

function readOptional(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

function readImageBase64(path: string): string | null {
  try {
    return readFileSync(path).toString("base64");
  } catch {
    return null;
  }
}

/** Simple unified-diff-like output (no dependency needed). */
function simpleDiff(a: string, b: string): string {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const result: string[] = [];

  const maxLen = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < maxLen; i++) {
    const al = aLines[i] ?? "";
    const bl = bLines[i] ?? "";
    if (al === bl) {
      result.push(`  ${al}`);
    } else {
      if (i < aLines.length) result.push(`- ${al}`);
      if (i < bLines.length) result.push(`+ ${bl}`);
    }
  }
  return result.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Collect diffs
// ---------------------------------------------------------------------------

interface DiffEntry {
  path: string;
  kind: "regression" | "parity" | "new";
  beforeDom: string | null;
  afterDom: string | null;
  beforeScreenshot: string | null;
  afterScreenshot: string | null;
}

function collectDiffs(): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const jsFiles = listHtmlFiles(JS_DIR);

  for (const file of jsFiles) {
    const jsContent = readFileSync(join(JS_DIR, file), "utf-8");
    const baselineContent = readOptional(join(BASELINE_DOM, file));
    const pngFile = file.replace(/\.html$/, ".png");

    if (baselineContent === null) {
      entries.push({
        path: file,
        kind: "new",
        beforeDom: null,
        afterDom: jsContent,
        beforeScreenshot: null,
        afterScreenshot: readImageBase64(join(JS_DIR, pngFile)),
      });
    } else if (jsContent !== baselineContent) {
      entries.push({
        path: file,
        kind: "regression",
        beforeDom: baselineContent,
        afterDom: jsContent,
        beforeScreenshot: readImageBase64(join(BASELINE_SCREENSHOTS, pngFile)),
        afterScreenshot: readImageBase64(join(JS_DIR, pngFile)),
      });
    }
  }

  // Parity diffs
  if (existsSync(PYTHON_DIR)) {
    const pyFiles = listHtmlFiles(PYTHON_DIR);
    for (const file of pyFiles) {
      const pyContent = readFileSync(join(PYTHON_DIR, file), "utf-8");
      const jsPath = join(JS_DIR, file);
      if (!existsSync(jsPath)) continue;
      const jsContent = readFileSync(jsPath, "utf-8");
      if (pyContent !== jsContent) {
        const pngFile = file.replace(/\.html$/, ".png");
        entries.push({
          path: file,
          kind: "parity",
          beforeDom: jsContent,
          afterDom: pyContent,
          beforeScreenshot: readImageBase64(join(JS_DIR, pngFile)),
          afterScreenshot: readImageBase64(join(PYTHON_DIR, pngFile)),
        });
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Generate HTML
// ---------------------------------------------------------------------------

function generateReport(diffs: DiffEntry[]): string {
  const kindLabel: Record<string, string> = {
    regression: "REGRESSION",
    parity: "PARITY MISMATCH",
    new: "NEW (no baseline)",
  };

  const kindColor: Record<string, string> = {
    regression: "#e74c3c",
    parity: "#e67e22",
    new: "#3498db",
  };

  const entryHtml = diffs
    .map((d) => {
      const diff =
        d.beforeDom && d.afterDom
          ? escapeHtml(simpleDiff(d.beforeDom, d.afterDom))
          : escapeHtml(d.afterDom ?? "");

      const beforeImg = d.beforeScreenshot
        ? `<img src="data:image/png;base64,${d.beforeScreenshot}" style="max-width: 100%;" />`
        : `<div style="color: #999; padding: 40px;">No baseline screenshot</div>`;

      const afterImg = d.afterScreenshot
        ? `<img src="data:image/png;base64,${d.afterScreenshot}" style="max-width: 100%;" />`
        : `<div style="color: #999; padding: 40px;">No screenshot</div>`;

      const beforeLabel =
        d.kind === "parity" ? "JS (expected)" : "Before (baseline)";
      const afterLabel =
        d.kind === "parity" ? "Python (actual)" : "After (current)";

      return `
    <div style="border: 1px solid #ddd; margin: 16px 0; border-radius: 6px; overflow: hidden;">
      <div style="padding: 12px 16px; background: ${kindColor[d.kind]}22; border-bottom: 1px solid #ddd;">
        <span style="font-weight: bold; color: ${kindColor[d.kind]};">${kindLabel[d.kind]}</span>
        <span style="margin-left: 12px; font-family: monospace;">${escapeHtml(d.path)}</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px;">
        <div>
          <h4 style="margin: 0 0 8px;">${beforeLabel}</h4>
          ${beforeImg}
        </div>
        <div>
          <h4 style="margin: 0 0 8px;">${afterLabel}</h4>
          ${afterImg}
        </div>
      </div>
      <details style="padding: 0 16px 16px;">
        <summary style="cursor: pointer; font-weight: bold;">DOM diff</summary>
        <pre style="background: #f8f8f8; padding: 12px; overflow: auto; font-size: 12px; line-height: 1.4; max-height: 600px;">${diff}</pre>
      </details>
    </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Visual Diff Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px; color: #333; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 8px; }
    pre .diff-add { color: #27ae60; }
    pre .diff-del { color: #e74c3c; }
  </style>
</head>
<body>
  <h1>Visual Diff Report</h1>
  <p>${diffs.length} difference(s) found.</p>
  ${entryHtml}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const diffs = collectDiffs();

  if (diffs.length === 0) {
    console.log("No diffs to report.");
    return;
  }

  const html = generateReport(diffs);
  writeFileSync(OUTPUT, html, "utf-8");
  console.log(`Diff report written to ${OUTPUT} (${diffs.length} entries)`);
}

main();
