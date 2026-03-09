/**
 * Accept current JS DOM snapshots and screenshots as the new baselines.
 *
 * Copies tmp/js/ → __snapshots__/dom/ and __snapshots__/screenshots/.
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

const ROOT = join(import.meta.dirname, "../..");
const JS_DIR = join(import.meta.dirname, "../tmp/js");
const BASELINE_DOM = join(ROOT, "__snapshots__/dom");
const BASELINE_SCREENSHOTS = join(ROOT, "__snapshots__/screenshots");

/** Recursively list files under a directory. */
function listFiles(dir: string, prefix = ""): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listFiles(join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

function main() {
  console.log("=== Updating baselines ===\n");

  if (!existsSync(JS_DIR)) {
    console.error("No JS snapshots found in tmp/js/. Run capture first.");
    process.exit(1);
  }

  const files = listFiles(JS_DIR);
  let domCount = 0;
  let screenshotCount = 0;

  for (const file of files) {
    const src = join(JS_DIR, file);

    if (file.endsWith(".html")) {
      const dest = join(BASELINE_DOM, file);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, readFileSync(src));
      domCount++;
    } else if (file.endsWith(".png")) {
      const dest = join(BASELINE_SCREENSHOTS, file);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(src, dest);
      screenshotCount++;
    }
  }

  console.log(
    `Updated ${domCount} DOM baseline(s) and ${screenshotCount} screenshot(s).`
  );
}

main();
