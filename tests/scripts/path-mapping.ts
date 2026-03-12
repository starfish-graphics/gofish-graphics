/**
 * path-mapping.ts
 *
 * Pure utility: maps JS story file paths to Python test file paths.
 * Extracted from check-python-sync.ts so it can be imported without
 * triggering that script's top-level imperative code.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";

const SCRIPTS_DIR = import.meta.dirname;
const TESTS_DIR = dirname(SCRIPTS_DIR);
const ROOT_DIR = dirname(TESTS_DIR);

/**
 * Maps a JS story file path to the expected Python test file path.
 *
 * e.g. "packages/gofish-graphics/stories/forwardsyntax/Bar/BarBasic.stories.tsx"
 *   →  "tests/python-stories/forwardsyntax/bar/test_bar_basic.py"
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
