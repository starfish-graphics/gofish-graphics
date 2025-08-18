// OKLCH Color Manipulation Functions
import chroma from "chroma-js";

export interface OKLCHColor {
  l: number; // Lightness (0-100)
  c: number; // Chroma (0-0.4 typically)
  h: number; // Hue (0-360)
}

// Parse OKLCH color string to components
export const parseOKLCH = (oklchString: string): OKLCHColor => {
  const match = oklchString.match(/oklch\((.+?)%\s+(.+?)\s+(.+?)\)/);
  if (!match) throw new Error(`Invalid OKLCH color: ${oklchString}`);

  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  };
};

// Convert OKLCH components back to string
export const oklchToString = ({ l, c, h }: OKLCHColor): string => {
  return `oklch(${l}% ${c} ${h})`;
};

// Modify chroma of an OKLCH color
export const modifyChroma = (
  oklchString: string,
  chromaMultiplier: number
): string => {
  const { l, c, h } = parseOKLCH(oklchString);
  const newChroma = Math.max(0, Math.min(0.4, c * chromaMultiplier)); // Clamp between 0 and 0.4
  return oklchToString({ l, c: newChroma, h });
};

// Create a variant of a color palette with modified chroma and luminance
export const createColorVariant = <
  T extends Record<string, Record<string, string>>,
>(
  originalPalette: T,
  chromaCallback: (chroma: number, shade: string, colorName: string) => number,
  luminanceCallback: (
    luminance: number,
    shade: string,
    colorName: string
  ) => number,
  opacity?: number
): T => {
  const variant: any = {};

  for (const [colorName, colorFamily] of Object.entries(originalPalette)) {
    variant[colorName] = {};

    for (const [shade, colorValue] of Object.entries(colorFamily)) {
      const { l, c, h } = parseOKLCH(colorValue);
      // console.log(l, c, h);
      const newChroma = chromaCallback(c, shade, colorName);
      const newLuminance = luminanceCallback(l, shade, colorName);
      let resultColor = oklchToString({
        l: newLuminance,
        c: newChroma,
        h,
      });

      // Apply opacity blending in RGB space if opacity is provided
      if (opacity !== undefined && opacity >= 0 && opacity <= 1) {
        // Convert OKLCH to RGB using chroma-js for blending
        const chromaColor = chroma(resultColor);
        const blendedColor = chromaColor.alpha(opacity);
        resultColor = blendedColor.css();
      }

      variant[colorName][shade] = resultColor;
    }
  }

  return variant as T;
};
