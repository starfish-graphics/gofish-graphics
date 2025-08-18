import {
  tailwindColors,
  tailwindColorsMuted,
  tailwindColorsVivid,
} from "../color";
import { Frame, Rect, StackX, StackY, layer, rect } from "../lib";

export const tailwindColorGrid = () => {
  const colorNames = Object.keys(tailwindColors);
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  // Create color swatches for each color family
  const colorRows = colorNames.map((colorName) => {
    const colorFamily =
      tailwindColors[colorName as keyof typeof tailwindColors];

    // Create squares for each shade
    const shadeSquares = shades.map((shade) => {
      const color = colorFamily[shade as keyof typeof colorFamily];
      return Rect({
        w: 40,
        h: 40,
        fill: color,
        // stroke: "oklch(87% 0 0)",
        // strokeWidth: 1,
      });
    });

    // Stack the shade squares horizontally with the color name
    // return Frame([
    //   // Color name label
    //   Rect({
    //     w: 80,
    //     h: 40,
    //     fill: "oklch(97% 0 0)",
    //     stroke: "oklch(87% 0 0)",
    //     strokeWidth: 1,
    //   }),
    //   // TODO: Add text label when text support is available

    //   // Stack the color squares
    return StackX({ spacing: 2 }, shadeSquares);
    //   // .translate(85, 0),
    // ]);
  });

  // Stack all rows vertically
  return StackY({ spacing: 2 }, colorRows);
  // .translate(20, 20);
};

export const tailwindColorGridCompact = () => {
  const colorNames = Object.keys(tailwindColors);
  const mainShades = [200, 400, 500, 600, 800]; // Fewer shades for compact view

  const colorRows = colorNames.map((colorName) => {
    const colorFamily =
      tailwindColors[colorName as keyof typeof tailwindColors];

    const shadeSquares = mainShades.map((shade) => {
      const color = colorFamily[shade as keyof typeof colorFamily];
      return Rect({
        w: 30,
        h: 30,
        fill: color,
        stroke: "oklch(87% 0 0)",
        strokeWidth: 0.5,
      });
    });

    return StackX(shadeSquares);
  });

  return StackY(colorRows);
  // .translate(20, 20);
};

// Generic function to create color grids for any palette
const createColorGrid = (palette: typeof tailwindColors, spacing = 2) => {
  const colorNames = Object.keys(palette);
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  const colorRows = colorNames.map((colorName) => {
    const colorFamily = palette[colorName as keyof typeof palette];

    const shadeSquares = shades.map((shade) => {
      const color = colorFamily[shade as keyof typeof colorFamily];
      return Rect({
        w: 40,
        h: 40,
        fill: color,
      });
    });

    return StackX({ spacing }, shadeSquares);
  });

  return StackY({ spacing }, colorRows);
};

const createColorGridCompact = (
  palette: typeof tailwindColors,
  spacing = 0
) => {
  const colorNames = Object.keys(palette);
  const mainShades = [200, 400, 500, 600, 800];

  const colorRows = colorNames.map((colorName) => {
    const colorFamily = palette[colorName as keyof typeof palette];

    const shadeSquares = mainShades.map((shade) => {
      const color = colorFamily[shade as keyof typeof colorFamily];
      return Rect({
        w: 30,
        h: 30,
        fill: color,
        stroke: "oklch(87% 0 0)",
        strokeWidth: 0.5,
      });
    });

    return StackX(shadeSquares);
  });

  return StackY(colorRows);
};

// Muted variant grids
export const tailwindColorGridMuted = () =>
  createColorGrid(tailwindColorsMuted);
export const tailwindColorGridMutedCompact = () =>
  createColorGridCompact(tailwindColorsMuted);

// Vivid variant grids
export const tailwindColorGridVivid = () =>
  createColorGrid(tailwindColorsVivid);
export const tailwindColorGridVividCompact = () =>
  createColorGridCompact(tailwindColorsVivid);

// Comparison grid showing all three variants side by side
export const tailwindColorComparison = () => {
  return StackX({ spacing: 40 }, [
    StackY({ spacing: 10 }, [
      // Text would go here: "Original"
      createColorGrid(tailwindColors),
    ]),
    StackY({ spacing: 10 }, [
      // Text would go here: "Muted"
      createColorGrid(tailwindColorsMuted),
    ]),
    StackY({ spacing: 10 }, [
      // Text would go here: "Vivid"
      createColorGrid(tailwindColors),
    ]),
  ]);
};

export const tailwindColorComparisonCompact = () => {
  return StackX({ spacing: 30 }, [
    createColorGridCompact(tailwindColors),
    createColorGridCompact(tailwindColorsMuted),
    createColorGridCompact(tailwindColorsVivid),
  ]);
};
