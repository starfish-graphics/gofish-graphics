/**
 * compare-python.ts
 *
 * Compares Python DOM output (tests/tmp/python/) against baselines (__snapshots__/dom/).
 *
 * - Missing baseline: warn (story not yet accepted on JS side)
 * - Content mismatch: parity failure
 * - Exit 1 on any failures
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { BASELINE_DOM, PYTHON_DIR, ROOT, listHtmlFiles } from "./diff-utils.js";
import { getSnapshotBranchName, pullSnapshots } from "./snapshot-branch.js";

// Pull baselines from the snapshot branch if not already present locally.
pullSnapshots(getSnapshotBranchName(), join(ROOT, "__snapshots__"));

console.log("Comparing Python DOM output against JS baselines...");

if (!existsSync(PYTHON_DIR)) {
  console.error(
    `ERROR: Python output directory not found: ${PYTHON_DIR}\nRun capture-python first.`
  );
  process.exit(1);
}

const pyFiles = listHtmlFiles(PYTHON_DIR);

if (pyFiles.length === 0) {
  console.log("No Python DOM files found. Nothing to compare.");
  process.exit(0);
}

let failures = 0;
let warnings = 0;
let passed = 0;

for (const file of pyFiles) {
  const baselinePath = join(BASELINE_DOM, file);
  const pythonPath = join(PYTHON_DIR, file);

  if (!existsSync(baselinePath)) {
    console.error(`  FAIL: No JS baseline for ${file} (not yet accepted)`);
    failures++;
    continue;
  }

  const pythonContent = readFileSync(pythonPath, "utf-8");
  const baselineContent = readFileSync(baselinePath, "utf-8");

  if (pythonContent !== baselineContent) {
    console.error(`  FAIL: Parity mismatch for ${file}`);
    failures++;
  } else {
    console.log(`  PASS: ${file}`);
    passed++;
  }
}

console.log(
  `\nResults: ${passed} passed, ${failures} failed, ${warnings} warned (no baseline)`
);

if (failures > 0) {
  console.error(
    `\n${failures} parity failure(s). Python DOM output does not match JS baselines.`
  );
  process.exit(1);
}

console.log("\nPython DOM parity check passed.");
