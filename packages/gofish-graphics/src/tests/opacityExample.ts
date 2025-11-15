import { createColorVariant } from "../oklch";
import { color } from "../color";

// Example: Create a transparent variant of the existing color palette
export const createTransparentColors = (opacity: number = 0.7) => {
  return createColorVariant(
    color,
    (chroma) => chroma, // Keep original chroma
    (luminance) => luminance, // Keep original luminance
    opacity // Apply opacity blending
  );
};

// Example: Create a muted transparent variant
export const createMutedTransparentColors = (opacity: number = 0.6) => {
  return createColorVariant(
    color,
    (chroma) => chroma * 0.8, // Reduce chroma by 20%
    (luminance) => luminance * 1.1, // Increase luminance by 10%
    opacity // Apply opacity blending
  );
};

// Example: Create a vibrant transparent variant
export const createVibrantTransparentColors = (opacity: number = 0.8) => {
  return createColorVariant(
    color,
    (chroma) => chroma * 1.3, // Increase chroma by 30%
    (luminance) => luminance * 0.95, // Slightly decrease luminance
    opacity // Apply opacity blending
  );
};

// Usage example
export const exampleUsage = () => {
  const transparentColors = createTransparentColors(0.5);
  const mutedColors = createMutedTransparentColors(0.4);
  const vibrantColors = createVibrantTransparentColors(0.7);

  console.log("Original blue[5]:", color.blue[5]);
  console.log("Transparent blue[5]:", transparentColors.blue[5]);
  console.log("Muted transparent blue[5]:", mutedColors.blue[5]);
  console.log("Vibrant transparent blue[5]:", vibrantColors.blue[5]);

  return {
    transparent: transparentColors,
    muted: mutedColors,
    vibrant: vibrantColors,
  };
};
