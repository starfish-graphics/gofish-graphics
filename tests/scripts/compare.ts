/**
 * Compare DOM snapshots:
 *   1. Regression check  — JS DOM (tmp/js/) vs stored baselines (__snapshots__/dom/)
 *   2. Parity check      — Python DOM (tmp/python/) vs JS DOM (tmp/js/)
 *
 * Flags:
 *   --js-only   Skip parity check (useful when Python stories aren't ready)
 *
 * Exit code 0 = all pass, 1 = any failure.
 * On failure, runs diff-report to generate tmp/diff-report.html.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

const ROOT = join(import.meta.dirname, "../..");
const BASELINE_DIR = join(ROOT, "__snapshots__/dom");
const JS_DIR = join(import.meta.dirname, "../tmp/js");
const PYTHON_DIR = join(import.meta.dirname, "../tmp/python");

const jsOnly = process.argv.includes("--js-only");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively list .html files under a directory. */
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

interface Failure {
  kind: "regression" | "parity" | "missing-baseline";
  path: string;
  expected?: string;
  actual?: string;
}

// ---------------------------------------------------------------------------
// Regression check: JS vs baselines
// ---------------------------------------------------------------------------

function checkRegressions(): Failure[] {
  const failures: Failure[] = [];
  const jsFiles = listHtmlFiles(JS_DIR);

  for (const file of jsFiles) {
    const baselinePath = join(BASELINE_DIR, file);
    const jsPath = join(JS_DIR, file);
    const jsContent = readFileSync(jsPath, "utf-8");

    if (!existsSync(baselinePath)) {
      failures.push({
        kind: "missing-baseline",
        path: file,
        actual: jsContent,
      });
      continue;
    }

    const baselineContent = readFileSync(baselinePath, "utf-8");
    if (jsContent !== baselineContent) {
      failures.push({
        kind: "regression",
        path: file,
        expected: baselineContent,
        actual: jsContent,
      });
    }
  }

  return failures;
}

// ---------------------------------------------------------------------------
// Parity check: Python vs JS
// ---------------------------------------------------------------------------

function checkParity(): Failure[] {
  const failures: Failure[] = [];
  const pythonFiles = listHtmlFiles(PYTHON_DIR);

  for (const file of pythonFiles) {
    const jsPath = join(JS_DIR, file);
    const pyPath = join(PYTHON_DIR, file);
    const pyContent = readFileSync(pyPath, "utf-8");

    if (!existsSync(jsPath)) {
      // No matching JS story — might be fine, just warn
      console.warn(`  Warning: Python story ${file} has no JS counterpart`);
      continue;
    }

    const jsContent = readFileSync(jsPath, "utf-8");
    if (pyContent !== jsContent) {
      failures.push({
        kind: "parity",
        path: file,
        expected: jsContent,
        actual: pyContent,
      });
    }
  }

  return failures;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("=== Comparing DOM snapshots ===\n");

  const regressions = checkRegressions();
  const parityFailures = jsOnly ? [] : checkParity();

  const rCount = regressions.filter((f) => f.kind === "regression").length;
  const mCount = regressions.filter(
    (f) => f.kind === "missing-baseline"
  ).length;
  const pCount = parityFailures.length;

  // Print summary
  if (rCount > 0) {
    console.log(`  ${rCount} regression(s) detected`);
    for (const f of regressions.filter((f) => f.kind === "regression")) {
      console.log(`    - ${f.path}`);
    }
  }

  if (mCount > 0) {
    console.log(`  ${mCount} new story/stories without baselines`);
    for (const f of regressions.filter((f) => f.kind === "missing-baseline")) {
      console.log(`    - ${f.path}`);
    }
  }

  if (pCount > 0) {
    console.log(`  ${pCount} parity failure(s) (Python ≠ JS)`);
    for (const f of parityFailures) {
      console.log(`    - ${f.path}`);
    }
  }

  const allFailures = [...regressions, ...parityFailures];

  if (allFailures.length === 0) {
    console.log("  All checks passed!");
    return;
  }

  // Generate diff report
  console.log("\nGenerating diff report...");
  try {
    execSync("tsx scripts/diff-report.ts", {
      cwd: join(import.meta.dirname, ".."),
      stdio: "inherit",
    });
  } catch {
    console.error("  Failed to generate diff report");
  }

  console.log(
    `\n${allFailures.length} failure(s). See tests/tmp/diff-report.html`
  );
  process.exit(1);
}

main();
