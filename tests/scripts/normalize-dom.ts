/**
 * DOM normalization for snapshot comparison.
 *
 * Both JS (Storybook) and Python (harness) DOM output go through this
 * pipeline so that superficial differences (attribute order, whitespace,
 * generated IDs, float precision) don't cause false negatives.
 */

// ---------------------------------------------------------------------------
// 1. Strip wrapper markup — keep only the chart container innerHTML
// ---------------------------------------------------------------------------

/**
 * Extract the meaningful chart content from wrapper divs.
 * Storybook wraps charts in `#storybook-root > div[style="margin: 20px"]`.
 * The harness wraps in `#gofish-harness-root`.
 * We want just the first child's innerHTML (the SVG + axes etc.).
 */
export function stripWrapper(html: string): string {
  // Remove the outermost div with margin:20px that initializeContainer() adds
  let s = html.trim();

  // Strip <div style="margin: 20px;"> wrapper (Storybook only)
  const marginWrap = /^<div\s+style="margin:\s*20px;?">\s*([\s\S]*?)\s*<\/div>$/i;
  const m = s.match(marginWrap);
  if (m) {
    s = m[1].trim();
  }

  return s;
}

// ---------------------------------------------------------------------------
// 2. Round floating-point numbers in SVG attributes & path data
// ---------------------------------------------------------------------------

const NUMERIC_ATTRS = new Set([
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "dx",
  "dy",
  "font-size",
  "stroke-width",
  "stroke-dashoffset",
  "stroke-dasharray",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
]);

/** Round a single number string to `decimals` places. */
function roundNum(numStr: string, decimals: number): string {
  const n = parseFloat(numStr);
  if (Number.isNaN(n)) return numStr;
  // Avoid -0
  const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** Round numbers inside an SVG `d` attribute (path data). */
function roundPathData(d: string, decimals: number): string {
  return d.replace(/-?\d+\.?\d*(?:e[+-]?\d+)?/gi, (m) =>
    roundNum(m, decimals),
  );
}

/** Round numbers in a `transform` attribute. */
function roundTransform(t: string, decimals: number): string {
  return t.replace(/-?\d+\.?\d*(?:e[+-]?\d+)?/gi, (m) =>
    roundNum(m, decimals),
  );
}

/** Round numbers in a `viewBox` attribute. */
function roundViewBox(vb: string, decimals: number): string {
  return vb
    .split(/\s+/)
    .map((v) => roundNum(v, decimals))
    .join(" ");
}

/**
 * Round floating-point values in SVG-related attributes to `decimals` places.
 */
export function roundFloats(html: string, decimals = 4): string {
  // Process attribute="value" pairs
  return html.replace(
    /(\s)([\w-]+)="([^"]*)"/g,
    (_match, space, attr, value) => {
      const attrLower = attr.toLowerCase();

      if (attrLower === "d") {
        return `${space}${attr}="${roundPathData(value, decimals)}"`;
      }
      if (attrLower === "transform") {
        return `${space}${attr}="${roundTransform(value, decimals)}"`;
      }
      if (attrLower === "viewbox") {
        return `${space}${attr}="${roundViewBox(value, decimals)}"`;
      }
      if (NUMERIC_ATTRS.has(attrLower)) {
        return `${space}${attr}="${roundNum(value, decimals)}"`;
      }
      // Also handle style properties with numeric values
      if (attrLower === "style") {
        const rounded = value.replace(
          /:\s*(-?\d+\.?\d*(?:e[+-]?\d+)?)(px|em|rem|%|)/gi,
          (_m: string, num: string, unit: string) =>
            `: ${roundNum(num, decimals)}${unit}`,
        );
        return `${space}${attr}="${rounded}"`;
      }
      return `${space}${attr}="${value}"`;
    },
  );
}

// ---------------------------------------------------------------------------
// 3. Normalize generated IDs (UUIDs / counters → sequential)
// ---------------------------------------------------------------------------

/**
 * Replace generated IDs (UUIDs, numeric counters, etc.) with stable sequential
 * identifiers so that DOM diffs are deterministic.
 *
 * Handles both `id="..."` and references like `url(#...)`, `href="#..."`,
 * `clip-path="url(#...)"`, etc.
 */
export function normalizeIds(html: string): string {
  // Collect all id values in document order
  const idRegex = /\bid="([^"]+)"/g;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = idRegex.exec(html)) !== null) {
    if (!ids.includes(m[1])) ids.push(m[1]);
  }

  // Build old→new map
  const idMap = new Map<string, string>();
  ids.forEach((old, i) => {
    idMap.set(old, `__id${i}__`);
  });

  // Replace id definitions
  let out = html.replace(/\bid="([^"]+)"/g, (_m, id) => {
    const newId = idMap.get(id) ?? id;
    return `id="${newId}"`;
  });

  // Replace references: url(#old) → url(#new)
  out = out.replace(/url\(#([^)]+)\)/g, (_m, id) => {
    const newId = idMap.get(id) ?? id;
    return `url(#${newId})`;
  });

  // Replace href="#old" → href="#new"
  out = out.replace(/href="#([^"]+)"/g, (_m, id) => {
    const newId = idMap.get(id) ?? id;
    return `href="#${newId}"`;
  });

  // Replace xlink:href="#old" → xlink:href="#new"
  out = out.replace(/xlink:href="#([^"]+)"/g, (_m, id) => {
    const newId = idMap.get(id) ?? id;
    return `xlink:href="#${newId}"`;
  });

  return out;
}

// ---------------------------------------------------------------------------
// 4. Sort attributes alphabetically per element
// ---------------------------------------------------------------------------

/**
 * Sort attributes of each HTML/SVG element alphabetically.
 * This prevents diffs from attribute-order variations across renders.
 */
export function sortAttributes(html: string): string {
  // Match opening tags: <tagname attr1="v1" attr2="v2" ...>
  return html.replace(/<(\w[\w-]*)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>/g, (_m, tag, attrs, selfClose) => {
    if (!attrs || !attrs.trim()) {
      return selfClose ? `<${tag} />` : `<${tag}>`;
    }
    // Parse attributes
    const attrList: [string, string][] = [];
    const attrRegex = /([\w:.-]+)="([^"]*)"/g;
    let am: RegExpExecArray | null;
    while ((am = attrRegex.exec(attrs)) !== null) {
      attrList.push([am[1], am[2]]);
    }
    // Sort alphabetically by attribute name
    attrList.sort((a, b) => a[0].localeCompare(b[0]));
    const sortedAttrs = attrList.map(([k, v]) => `${k}="${v}"`).join(" ");
    return selfClose ? `<${tag} ${sortedAttrs} />` : `<${tag} ${sortedAttrs}>`;
  });
}

// ---------------------------------------------------------------------------
// 5. Normalize whitespace — consistent indentation
// ---------------------------------------------------------------------------

/**
 * Normalise whitespace: collapse runs of whitespace between tags to a single
 * newline, trim lines, and re-indent with 2-space indentation based on nesting.
 */
export function normalizeWhitespace(html: string): string {
  // Split on `><` boundaries to get one tag per line
  let s = html.replace(/>\s+</g, ">\n<");
  // Also break after text nodes
  s = s.replace(/>([^<]+)</g, ">$1\n<");

  const lines = s.split("\n").map((l) => l.trim()).filter(Boolean);

  const result: string[] = [];
  let depth = 0;

  for (const line of lines) {
    // Closing tag → decrease depth before printing
    if (/^<\//.test(line)) {
      depth = Math.max(0, depth - 1);
    }

    result.push("  ".repeat(depth) + line);

    // Self-closing tag → no depth change
    if (/\/>$/.test(line)) {
      // no change
    }
    // Opening tag (not closing, not self-closing) → increase depth
    else if (/^<[^/]/.test(line) && !/<\/[^>]+>$/.test(line)) {
      depth++;
    }
  }

  return result.join("\n");
}

// ---------------------------------------------------------------------------
// 6. Full normalization pipeline
// ---------------------------------------------------------------------------

export interface NormalizeOptions {
  /** Number of decimal places for float rounding (default: 4) */
  decimals?: number;
}

/**
 * Run the full normalization pipeline on raw innerHTML.
 */
export function normalizeDom(
  html: string,
  options: NormalizeOptions = {},
): string {
  const { decimals = 4 } = options;

  let s = html;
  s = stripWrapper(s);
  s = roundFloats(s, decimals);
  s = normalizeIds(s);
  s = sortAttributes(s);
  s = normalizeWhitespace(s);

  return s;
}
