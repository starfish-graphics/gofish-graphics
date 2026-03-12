/**
 * check-python-sync.ts
 *
 * Validates Python story synchronization with JS stories in a PR.
 * Replaces check-python-sync.sh.
 *
 * Usage: tsx scripts/check-python-sync.ts [base-ref]
 *   base-ref defaults to BASE_REF env var or "origin/main"
 *
 * Checks:
 *   1. Coverage: JS story added → Python counterpart must be created (unless exempt)
 *   2. Coverage: JS story deleted → Python counterpart must also be deleted
 *   3. Spec sync: JS story modified + Python exists → Python must also be modified
 *
 * Writes results to tests/tmp/sync-results.json for parity review site.
 */

import { execSync } from "child_process";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { join, dirname } from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SCRIPTS_DIR = import.meta.dirname;
const TESTS_DIR = dirname(SCRIPTS_DIR);
const ROOT_DIR = dirname(TESTS_DIR);
const EXEMPT_FILE = join(TESTS_DIR, ".python-sync-exempt");
const OUT_DIR = join(TESTS_DIR, "tmp");
const OUT_FILE = join(OUT_DIR, "sync-results.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  jsFile: string;
  pythonFile: string;
  changeType: "added" | "deleted" | "modified";
  status: "ok" | "error" | "warning" | "exempt";
  message: string;
}

// ---------------------------------------------------------------------------
// Path mapping: JS story → Python test file
// ---------------------------------------------------------------------------

/**
 * Maps a JS story file path to the expected Python test file path.
 *
 * e.g. "packages/gofish-graphics/stories/forwardsyntax/Bar/BarBasic.stories.tsx"
 *   →  "tests/python-stories/forwardsyntax/test_bar_basic.py"
 */
export function mapJsToPython(jsFile: string): string {
  // Read the Storybook title from the JS file and derive the Python path from it.
  // e.g. title: "Forward Syntax V3/Bar/Basic" → "tests/python-stories/forward-syntax-v3/bar/test_basic.py"
  const absPath = join(ROOT_DIR, jsFile);
  let title: string | null = null;
  try {
    const content = readFileSync(absPath, "utf-8");
    const m = content.match(/title:\s*["'](.+?)["']/);
    if (m) title = m[1];
  } catch {}

  if (title) {
    const toKebab = (s: string) =>
      s.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
    const segments = title.split("/").map(toKebab);
    const dirPath = segments.slice(0, -1).join("/");
    const basePart = segments[segments.length - 1].replace(/-/g, "_");
    return `tests/python-stories/${dirPath}/test_${basePart}.py`;
  }

  // Fallback: derive from file path (CamelCase → snake_case, flatten one level)
  let rel = jsFile.replace(/^packages\/gofish-graphics\/stories\//, "");
  rel = rel.replace(/\.stories\.tsx$/, "");
  const lastSlash = rel.lastIndexOf("/");
  const dirPart = lastSlash >= 0 ? rel.slice(0, lastSlash) : ".";
  const basePart = lastSlash >= 0 ? rel.slice(lastSlash + 1) : rel;
  const toSnake = (s: string) =>
    s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  const snakeBase = toSnake(basePart);
  let snakeDir = toSnake(dirPart);
  if (snakeDir.includes("/")) {
    snakeDir = snakeDir.replace(/\/[^/]*$/, "");
  }
  const prefix = snakeDir && snakeDir !== "." ? `${snakeDir}/` : "";
  return `tests/python-stories/${prefix}test_${snakeBase}.py`;
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function gitDiff(filter: string, baseRef: string): string[] {
  try {
    const output = execSync(
      `git diff --name-only --diff-filter=${filter} "${baseRef}"...HEAD`,
      { cwd: ROOT_DIR, encoding: "utf-8" }
    );
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Exempt list
// ---------------------------------------------------------------------------

function loadExemptSet(): Set<string> {
  if (!existsSync(EXEMPT_FILE)) return new Set();
  const lines = readFileSync(EXEMPT_FILE, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return new Set(lines);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const baseRef = process.argv[2] ?? process.env.BASE_REF ?? "origin/main";

console.log(`Checking Python story sync against ${baseRef}...`);

const exemptSet = loadExemptSet();

const addedJs = gitDiff("A", baseRef).filter((f) =>
  f.match(/^packages\/gofish-graphics\/stories\/.*\.stories\.tsx$/)
);
const deletedJs = gitDiff("D", baseRef).filter((f) =>
  f.match(/^packages\/gofish-graphics\/stories\/.*\.stories\.tsx$/)
);
const modifiedJs = gitDiff("M", baseRef).filter((f) =>
  f.match(/^packages\/gofish-graphics\/stories\/.*\.stories\.tsx$/)
);
const allChangedFiles = new Set(gitDiff("ACDMRT", baseRef));

const results: SyncResult[] = [];
let errors = 0;

// ---- Coverage: added JS stories ----
for (const jsFile of addedJs) {
  const pythonFile = mapJsToPython(jsFile);

  if (exemptSet.has(jsFile)) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "added",
      status: "exempt",
      message: `Exempt from Python parity requirement`,
    });
    console.log(`  EXEMPT: ${jsFile}`);
    continue;
  }

  const pythonExists = existsSync(join(ROOT_DIR, pythonFile));
  const pythonAdded = allChangedFiles.has(pythonFile);

  if (!pythonExists && !pythonAdded) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "added",
      status: "error",
      message: `JS story added but no Python counterpart created (expected ${pythonFile})`,
    });
    console.error(`  ERROR: ${jsFile} added but ${pythonFile} not created`);
    errors++;
  } else {
    results.push({
      jsFile,
      pythonFile,
      changeType: "added",
      status: "ok",
      message: `Python counterpart present`,
    });
    console.log(`  OK: ${jsFile} ↔ ${pythonFile}`);
  }
}

// ---- Coverage: deleted JS stories ----
for (const jsFile of deletedJs) {
  const pythonFile = mapJsToPython(jsFile);

  if (exemptSet.has(jsFile)) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "deleted",
      status: "exempt",
      message: `Exempt from Python parity requirement`,
    });
    continue;
  }

  const pythonStillExists = existsSync(join(ROOT_DIR, pythonFile));
  const pythonDeleted = !pythonStillExists || allChangedFiles.has(pythonFile);

  if (pythonStillExists && !allChangedFiles.has(pythonFile)) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "deleted",
      status: "error",
      message: `JS story deleted but Python counterpart still exists (${pythonFile})`,
    });
    console.error(
      `  ERROR: ${jsFile} deleted but ${pythonFile} still exists`
    );
    errors++;
  } else if (existsSync(join(ROOT_DIR, pythonFile)) || pythonDeleted) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "deleted",
      status: "ok",
      message: `Python counterpart also deleted`,
    });
    console.log(`  OK: ${jsFile} deleted ↔ ${pythonFile} deleted`);
  }
}

// ---- Spec sync: modified JS stories ----
for (const jsFile of modifiedJs) {
  const pythonFile = mapJsToPython(jsFile);

  if (exemptSet.has(jsFile)) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "modified",
      status: "exempt",
      message: `Exempt from Python parity requirement`,
    });
    console.log(`  EXEMPT: ${jsFile}`);
    continue;
  }

  const pythonExists = existsSync(join(ROOT_DIR, pythonFile));

  if (!pythonExists) {
    // Warning only — coverage check handles missing Python files
    results.push({
      jsFile,
      pythonFile,
      changeType: "modified",
      status: "warning",
      message: `JS story modified but no Python counterpart exists`,
    });
    console.warn(`  WARNING: ${jsFile} modified but ${pythonFile} does not exist`);
    continue;
  }

  const pythonModified = allChangedFiles.has(pythonFile);

  if (!pythonModified) {
    results.push({
      jsFile,
      pythonFile,
      changeType: "modified",
      status: "error",
      message: `JS story modified but Python counterpart was not updated (${pythonFile})`,
    });
    console.error(
      `  ERROR: ${jsFile} changed but ${pythonFile} was not updated`
    );
    errors++;
  } else {
    results.push({
      jsFile,
      pythonFile,
      changeType: "modified",
      status: "ok",
      message: `Python counterpart also updated`,
    });
    console.log(`  OK: ${jsFile} ↔ ${pythonFile}`);
  }
}

if (results.length === 0) {
  console.log("No JS story files changed. Python sync check passed.");
}

// ---------------------------------------------------------------------------
// Write sync-results.json
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
console.log(`\nSync results written to ${OUT_FILE}`);

// ---------------------------------------------------------------------------
// Exit
// ---------------------------------------------------------------------------

if (errors > 0) {
  console.error(
    `\n${errors} Python story sync error(s). Update Python stories to match JS changes.`
  );
  process.exit(1);
}

console.log("\nPython sync check passed.");
