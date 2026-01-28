export const FALLBACK_FONT_FAMILY = "system-ui, sans-serif";

const defaultWarnedKeys = new Set<string>();

export function getPrimaryFamily(fontFamily: string): string {
  const first = fontFamily.split(",")[0];
  return first ? first.trim() : fontFamily;
}

export function buildFontSpec(fontSize: number, primaryFamily: string): string {
  const hasSpaces = /\s/.test(primaryFamily);
  return hasSpaces
    ? `${fontSize}px "${primaryFamily}"`
    : `${fontSize}px ${primaryFamily}`;
}

export type FontsApi = { check(spec: string): boolean };

export type GetEffectiveFontFamilyOptions = {
  fontSize: number;
  fontFamily: string;
  fontsApi?: FontsApi | null;
  warnedKeys?: Set<string>;
  warn?: (msg: string) => void;
};

export function getEffectiveFontFamily(
  opts: GetEffectiveFontFamilyOptions
): string {
  const {
    fontSize,
    fontFamily,
    fontsApi,
    warnedKeys = defaultWarnedKeys,
    warn = console.warn,
  } = opts;

  const primaryFamily = getPrimaryFamily(fontFamily);
  const fontSpec = buildFontSpec(fontSize, primaryFamily);

  const api =
    fontsApi ??
    (typeof document !== "undefined" &&
    document.fonts &&
    typeof document.fonts.check === "function"
      ? { check: (s: string) => document.fonts!.check(s) }
      : null);

  const fontLoaded = api ? api.check(fontSpec) : false;
  if (fontLoaded) return fontFamily;

  const key = `${fontFamily}|${fontSize}`;
  if (!warnedKeys.has(key)) {
    warnedKeys.add(key);
    warn(`Font "${primaryFamily}" not found. Load it via CSS or a <link> tag.`);
  }
  return FALLBACK_FONT_FAMILY;
}
