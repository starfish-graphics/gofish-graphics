import { createColorVariant } from "../oklch";

// Sample color palette
const samplePalette = {
  blue: {
    50: "oklch(95% 0.02 240)",
    100: "oklch(90% 0.04 240)",
    200: "oklch(80% 0.08 240)",
    300: "oklch(70% 0.12 240)",
    400: "oklch(60% 0.16 240)",
    500: "oklch(50% 0.20 240)",
    600: "oklch(40% 0.18 240)",
    700: "oklch(30% 0.16 240)",
    800: "oklch(20% 0.14 240)",
    900: "oklch(10% 0.12 240)",
  },
  red: {
    50: "oklch(95% 0.02 0)",
    100: "oklch(90% 0.04 0)",
    200: "oklch(80% 0.08 0)",
    300: "oklch(70% 0.12 0)",
    400: "oklch(60% 0.16 0)",
    500: "oklch(50% 0.20 0)",
    600: "oklch(40% 0.18 0)",
    700: "oklch(30% 0.16 0)",
    800: "oklch(20% 0.14 0)",
    900: "oklch(10% 0.12 0)",
  },
};

// Test opacity blending
export const testOpacityBlending = () => {
  console.log("Original palette:");
  console.log(samplePalette.blue["500"]); // oklch(50% 0.20 240)

  // Create variant with 50% opacity
  const transparentVariant = createColorVariant(
    samplePalette,
    (chroma) => chroma, // Keep original chroma
    (luminance) => luminance, // Keep original luminance
    0.5 // 50% opacity
  );

  console.log("\nWith 50% opacity:");
  console.log(transparentVariant.blue["500"]); // Should be rgba() with 0.5 alpha

  // Create variant with 25% opacity
  const veryTransparentVariant = createColorVariant(
    samplePalette,
    (chroma) => chroma * 1.2, // Increase chroma by 20%
    (luminance) => luminance * 0.9, // Decrease luminance by 10%
    0.25 // 25% opacity
  );

  console.log("\nWith modified chroma/luminance and 25% opacity:");
  console.log(veryTransparentVariant.blue["500"]);

  return {
    original: samplePalette,
    transparent50: transparentVariant,
    transparent25: veryTransparentVariant,
  };
};

// Run the test
if (typeof window !== "undefined") {
  // Browser environment
  (window as any).testOpacityBlending = testOpacityBlending;
} else {
  // Node environment
  testOpacityBlending();
}
