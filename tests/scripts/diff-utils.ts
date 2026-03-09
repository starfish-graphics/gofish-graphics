/**
 * Shared utilities for diff collection, story acceptance, and DOM diff formatting.
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  existsSync,
  cpSync,
} from "fs";
import { join, dirname } from "path";
import { diffLines } from "diff";

export const ROOT = join(import.meta.dirname, "../..");
export const BASELINE_DOM = join(ROOT, "__snapshots__/dom");
export const BASELINE_SCREENSHOTS = join(ROOT, "__snapshots__/screenshots");
export const JS_DIR = join(import.meta.dirname, "../tmp/js");
export const PYTHON_DIR = join(import.meta.dirname, "../tmp/python");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiffEntry {
  /** Relative path like "forward-syntax-v3/bar--basic.html" */
  path: string;
  kind: "regression" | "parity" | "new";
  /** "pending" | "accepted" | "rejected" — runtime review state */
  status: "pending" | "accepted" | "rejected";
  beforeDom: string | null;
  afterDom: string | null;
  /** Absolute path to before screenshot PNG (or null) */
  beforeScreenshotPath: string | null;
  /** Absolute path to after screenshot PNG (or null) */
  afterScreenshotPath: string | null;
  /** Pixel diff percentage (0–100), null if not yet computed */
  diffPercent: number | null;
}

// ---------------------------------------------------------------------------
// File listing
// ---------------------------------------------------------------------------

export function listHtmlFiles(dir: string, prefix = ""): string[] {
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

export function readOptional(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Collect diffs
// ---------------------------------------------------------------------------

export function collectDiffs(): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const jsFiles = listHtmlFiles(JS_DIR);

  for (const file of jsFiles) {
    const jsContent = readFileSync(join(JS_DIR, file), "utf-8");
    const baselineContent = readOptional(join(BASELINE_DOM, file));
    const pngFile = file.replace(/\.html$/, ".png");
    const afterPng = join(JS_DIR, pngFile);

    if (baselineContent === null) {
      entries.push({
        path: file,
        kind: "new",
        status: "pending",
        beforeDom: null,
        afterDom: jsContent,
        beforeScreenshotPath: null,
        afterScreenshotPath: existsSync(afterPng) ? afterPng : null,
        diffPercent: null,
      });
    } else if (jsContent !== baselineContent) {
      const beforePng = join(BASELINE_SCREENSHOTS, pngFile);
      entries.push({
        path: file,
        kind: "regression",
        status: "pending",
        beforeDom: baselineContent,
        afterDom: jsContent,
        beforeScreenshotPath: existsSync(beforePng) ? beforePng : null,
        afterScreenshotPath: existsSync(afterPng) ? afterPng : null,
        diffPercent: null,
      });
    }
  }

  // Parity diffs
  if (existsSync(PYTHON_DIR)) {
    const pyFiles = listHtmlFiles(PYTHON_DIR);
    for (const file of pyFiles) {
      const jsPath = join(JS_DIR, file);
      if (!existsSync(jsPath)) continue;
      const pyContent = readFileSync(join(PYTHON_DIR, file), "utf-8");
      const jsContent = readFileSync(jsPath, "utf-8");
      if (pyContent !== jsContent) {
        const pngFile = file.replace(/\.html$/, ".png");
        const beforePng = join(JS_DIR, pngFile);
        const afterPng = join(PYTHON_DIR, pngFile);
        entries.push({
          path: file,
          kind: "parity",
          status: "pending",
          beforeDom: jsContent,
          afterDom: pyContent,
          beforeScreenshotPath: existsSync(beforePng) ? beforePng : null,
          afterScreenshotPath: existsSync(afterPng) ? afterPng : null,
          diffPercent: null,
        });
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Accept a story (copy tmp → baselines)
// ---------------------------------------------------------------------------

export function acceptStory(path: string): void {
  const htmlSrc = join(JS_DIR, path);
  const htmlDest = join(BASELINE_DOM, path);
  mkdirSync(dirname(htmlDest), { recursive: true });
  writeFileSync(htmlDest, readFileSync(htmlSrc));

  const pngFile = path.replace(/\.html$/, ".png");
  const pngSrc = join(JS_DIR, pngFile);
  const pngDest = join(BASELINE_SCREENSHOTS, pngFile);
  if (existsSync(pngSrc)) {
    mkdirSync(dirname(pngDest), { recursive: true });
    cpSync(pngSrc, pngDest);
  }
}

// ---------------------------------------------------------------------------
// DOM diff formatting
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Returns an HTML snippet with colored line diff (green/red/gray). */
export function formatDomDiff(before: string, after: string): string {
  const changes = diffLines(before, after);
  let lineNum = 1;
  const rows: string[] = [];

  for (const change of changes) {
    const lines = change.value.split("\n");
    // diffLines includes a trailing empty string after the last newline
    if (lines[lines.length - 1] === "") lines.pop();

    const bg = change.added
      ? "#d4edda"
      : change.removed
        ? "#f8d7da"
        : "#f8f8f8";
    const fg = change.added ? "#155724" : change.removed ? "#721c24" : "#666";
    const prefix = change.added ? "+" : change.removed ? "-" : " ";

    for (const line of lines) {
      const lineNumStr = change.removed ? "" : String(lineNum);
      if (!change.removed) lineNum++;
      rows.push(
        `<tr style="background:${bg};">` +
          `<td style="color:#999;text-align:right;padding:0 8px;user-select:none;min-width:40px;font-size:11px;">${escapeHtml(lineNumStr)}</td>` +
          `<td style="color:${fg};padding:0 4px;user-select:none;">${prefix}</td>` +
          `<td style="color:${fg};white-space:pre;padding:0 8px;">${escapeHtml(line)}</td>` +
          `</tr>`
      );
    }
  }

  return (
    `<table style="border-collapse:collapse;width:100%;font-family:monospace;font-size:12px;line-height:1.4;">` +
    rows.join("") +
    `</table>`
  );
}
