/**
 * compare-python.ts
 *
 * Compares Python DOM output (tests/tmp/python/) against baselines (__snapshots__/dom/).
 *
 * - Missing baseline: warn (story not yet accepted on JS side)
 * - Content mismatch: parity failure
 * - Exit 1 on any failures
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { BASELINE_DOM, PYTHON_DIR, ROOT, listHtmlFiles } from "./diff-utils.js";
import { getSnapshotBranchName, pullSnapshots } from "./snapshot-branch.js";

const SUMMARY_PATH = join(import.meta.dirname, "../tmp/parity-summary.json");

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

let parityMismatches = 0;
let missingBaselines = 0;
let passed = 0;

for (const file of pyFiles) {
  const baselinePath = join(BASELINE_DOM, file);
  const pythonPath = join(PYTHON_DIR, file);

  if (!existsSync(baselinePath)) {
    console.error(`  FAIL: No JS baseline for ${file} (not yet accepted)`);
    missingBaselines++;
    continue;
  }

  const pythonContent = readFileSync(pythonPath, "utf-8");
  const baselineContent = readFileSync(baselinePath, "utf-8");

  if (pythonContent !== baselineContent) {
    console.error(`  FAIL: Parity mismatch for ${file}`);
    parityMismatches++;
  } else {
    console.log(`  PASS: ${file}`);
    passed++;
  }
}

const failures = parityMismatches + missingBaselines;

console.log(
  `\nResults: ${passed} passed, ${parityMismatches} parity mismatches, ${missingBaselines} missing baselines`
);

writeFileSync(
  SUMMARY_PATH,
  JSON.stringify({ parityMismatches, missingBaselines }, null, 2)
);

if (failures > 0) {
  console.error(
    `\n${failures} parity failure(s). Python DOM output does not match JS baselines.`
  );
  process.exit(1);
}

console.log("\nPython DOM parity check passed.");
