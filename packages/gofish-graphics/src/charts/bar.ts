import { chart, rect, spread } from "../lib";

export const bar = (
  data: any,
  options: { x?: string; y?: string; w?: string; h?: string }
) => {
  // Error if both x and y are provided (ambiguous)
  if (options.x && options.y) {
    throw new Error(
      "bar chart cannot have both 'x' and 'y' encoding channels. Use 'x' for vertical bars or 'y' for horizontal bars"
    );
  }

  // Vertical bar chart: if x is provided, spread along x-axis and use h for height
  if (options.x) {
    return chart(data)
      .flow(spread(options.x, { dir: "x" }))
      .mark(rect({ h: options.h }));
  }

  // Horizontal bar chart: if y is provided, spread along y-axis and use w for width
  if (options.y) {
    return chart(data)
      .flow(spread(options.y, { dir: "y" }))
      .mark(rect({ w: options.w }));
  }

  // Error if neither x nor y is provided
  throw new Error(
    "bar chart requires either 'x' (for vertical bars) or 'y' (for horizontal bars) encoding channel"
  );
};
