import { chart, rect, spread, Mark } from "../lib";

export const bar = <T extends Record<string, any>>(
  data: T[],
  options: {
    x?: keyof T;
    y?: keyof T;
    w?: keyof T;
    h?: keyof T;
    fill?: keyof T | string;
    mark?: (options: {
      h?: string | number | keyof T;
      w?: string | number | keyof T;
      fill?: string | keyof T;
      [key: string]: any;
    }) => Mark<T | T[] | { item: T | T[]; key: number | string }>;
  }
) => {
  // Error if both x and y are provided (ambiguous)
  // COMBAK: probably this should do a grid
  if (options.x && options.y) {
    throw new Error(
      "bar chart cannot have both 'x' and 'y' encoding channels. Use 'x' for vertical bars or 'y' for horizontal bars"
    );
  }

  const markFn = options.mark ?? rect;

  // Vertical bar chart: if x is provided, spread along x-axis and use h for height
  if (options.x) {
    return chart(data)
      .flow(spread(options.x, { dir: "x" }))
      .mark(markFn({ h: options.h, fill: options.fill }));
  }

  // Horizontal bar chart: if y is provided, spread along y-axis and use w for width
  if (options.y) {
    return chart(data)
      .flow(spread(options.y, { dir: "y" }))
      .mark(markFn({ w: options.w, fill: options.fill }));
  }

  // Error if neither x nor y is provided
  // COMBAK: probably this should render a single rectangle at the origin
  throw new Error(
    "bar chart requires either 'x' (for vertical bars) or 'y' (for horizontal bars) encoding channel"
  );
};
