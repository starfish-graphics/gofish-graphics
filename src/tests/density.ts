export interface DitheringConfig {
  width: number; // Total width of the output
  maxDensitySpacing: number; // Spacing between points at maximum density (default 4px)
}

export function generateDithering(config: DitheringConfig, samplingFunction: (x: number) => number): number[] {
  const { width, maxDensitySpacing = 4 } = config;
  const points: number[] = [];

  // Generate dithering points based on the sampling function
  let x = 0;

  while (x < width) {
    // Get density value from the sampling function (should return value between 0 and 1)
    const density = samplingFunction(x);

    // Use density value to determine point spacing
    // At density = 1, spacing = maxDensitySpacing
    // At density = 0, spacing = infinity (no points)
    if (density > 0) {
      const spacing = maxDensitySpacing / density;
      points.push(x);
      x += spacing;
    } else {
      // Skip areas with zero density
      x += maxDensitySpacing;
    }
  }

  return points;
}
