/**
 * Tests for font helpers: getPrimaryFamily, buildFontSpec, getEffectiveFontFamily.
 * Includes one test for a font that's present and one for a font that isn't.
 */

import {
  getPrimaryFamily,
  buildFontSpec,
  getEffectiveFontFamily,
  FALLBACK_FONT_FAMILY,
} from "../ast/shapes/fontUtils";

function testGetPrimaryFamily(): boolean {
  console.log("Test: getPrimaryFamily");

  const cases: [string, string][] = [
    ["Space Grotesk, sans-serif", "Space Grotesk"],
    ["Inter", "Inter"],
    ["system-ui, sans-serif", "system-ui"],
  ];
  for (const [input, expected] of cases) {
    const got = getPrimaryFamily(input);
    if (got !== expected) {
      console.log(
        `  ✗ getPrimaryFamily(${JSON.stringify(input)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`
      );
      return false;
    }
  }
  console.log("  ✓ PASSED");
  return true;
}

function testBuildFontSpec(): boolean {
  console.log("Test: buildFontSpec");

  if (buildFontSpec(16, "Inter") !== "16px Inter") {
    console.log(`  ✗ buildFontSpec(16, "Inter") expected "16px Inter"`);
    return false;
  }
  if (buildFontSpec(12, "Space Grotesk") !== '12px "Space Grotesk"') {
    console.log(
      `  ✗ buildFontSpec(12, "Space Grotesk") expected '12px "Space Grotesk"'`
    );
    return false;
  }
  console.log("  ✓ PASSED");
  return true;
}

function testFontPresent(): boolean {
  console.log("Test: font present (document.fonts.check returns true)");

  const warnedKeys = new Set<string>();
  const warnings: string[] = [];
  const warn = (msg: string) => warnings.push(msg);

  const fontsApi = { check: (_spec: string) => true };
  const result = getEffectiveFontFamily({
    fontSize: 16,
    fontFamily: "Inter, sans-serif",
    resolvedFont: undefined,
    fontsApi,
    warnedKeys,
    warn,
  });

  if (result !== "Inter, sans-serif") {
    console.log(
      `  ✗ expected fontFamily "Inter, sans-serif", got ${JSON.stringify(result)}`
    );
    return false;
  }
  if (warnings.length !== 0) {
    console.log(
      `  ✗ expected no console.warn, got ${warnings.length}: ${warnings.join("; ")}`
    );
    return false;
  }
  console.log("  ✓ PASSED");
  return true;
}

function testFontNotPresent(): boolean {
  console.log("Test: font not present (document.fonts.check returns false)");

  const warnedKeys = new Set<string>();
  const warnings: string[] = [];
  const warn = (msg: string) => warnings.push(msg);

  const fontsApi = { check: (_spec: string) => false };
  const result = getEffectiveFontFamily({
    fontSize: 16,
    fontFamily: "SomeMissingFont, sans-serif",
    resolvedFont: undefined,
    fontsApi,
    warnedKeys,
    warn,
  });

  if (result !== FALLBACK_FONT_FAMILY) {
    console.log(
      `  ✗ expected fallback ${JSON.stringify(FALLBACK_FONT_FAMILY)}, got ${JSON.stringify(result)}`
    );
    return false;
  }
  if (warnings.length !== 1) {
    console.log(
      `  ✗ expected exactly one console.warn, got ${warnings.length}: ${warnings.join("; ")}`
    );
    return false;
  }
  if (
    !warnings[0].includes("SomeMissingFont") ||
    !warnings[0].includes("link")
  ) {
    console.log(
      `  ✗ expected warn message to mention font name and link, got: ${warnings[0]}`
    );
    return false;
  }
  console.log("  ✓ PASSED");
  return true;
}

function testResolvedFontSkipsCheck(): boolean {
  console.log("Test: resolvedFont set skips check and uses fontFamily");

  const warnedKeys = new Set<string>();
  const warnings: string[] = [];
  const warn = (msg: string) => warnings.push(msg);
  const fontsApi = { check: (_spec: string) => false };

  const result = getEffectiveFontFamily({
    fontSize: 16,
    fontFamily: "SomeMissingFont, sans-serif",
    resolvedFont: { layout: () => {} },
    fontsApi,
    warnedKeys,
    warn,
  });

  if (result !== "SomeMissingFont, sans-serif") {
    console.log(
      `  ✗ expected fontFamily when resolvedFont set, got ${JSON.stringify(result)}`
    );
    return false;
  }
  if (warnings.length !== 0) {
    console.log(
      `  ✗ expected no warn when resolvedFont set, got ${warnings.length}`
    );
    return false;
  }
  console.log("  ✓ PASSED");
  return true;
}

export function runFontUtilsTests(): boolean {
  console.log("Running font utils tests...\n");

  const results = [
    testGetPrimaryFamily(),
    testBuildFontSpec(),
    testFontPresent(),
    testFontNotPresent(),
    testResolvedFontSkipsCheck(),
  ];

  const allPassed = results.every((r) => r);
  console.log();
  if (allPassed) {
    console.log("✓ All font utils tests passed!");
  } else {
    console.log("✗ Some font utils tests failed");
  }
  return allPassed;
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") || "")) {
  const ok = runFontUtilsTests();
  process.exit(ok ? 0 : 1);
}
