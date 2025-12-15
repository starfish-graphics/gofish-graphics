import { chart, rect, spread, stack, Mark, ChartBuilder } from "../lib";
import { Stackable } from "./stackable";

// Wrapper class that adds .stack() method to ChartBuilder
class BarChartBuilder<TInput, TOutput = TInput>
  implements Stackable<TInput, TOutput>
{
  private builder: ChartBuilder<TInput, TOutput>;
  private readonly barOrientation: "x" | "y";
  private readonly markOptions: {
    h?: string | number;
    w?: string | number;
    fill?: string;
  };
  private readonly markFn?: (options: any) => Mark<any>;

  constructor(
    builder: ChartBuilder<TInput, TOutput>,
    barOrientation: "x" | "y",
    markOptions: {
      h?: string | number;
      w?: string | number;
      fill?: string;
    },
    markFn?: (options: any) => Mark<any>
  ) {
    this.builder = builder;
    this.barOrientation = barOrientation;
    this.markOptions = markOptions;
    this.markFn = markFn;
  }

  flow<T1>(op1: any): BarChartBuilder<TInput, T1> {
    return new BarChartBuilder(
      this.builder.flow(op1) as any,
      this.barOrientation,
      this.markOptions as any,
      this.markFn
    );
  }

  mark(mark?: Mark<TOutput>): any {
    const finalMark =
      mark ??
      (this.markFn ? this.markFn(this.markOptions) : rect(this.markOptions));
    return this.builder.mark(finalMark as Mark<TOutput>);
  }

  stack<K extends keyof TOutput>(
    field: K,
    options: {
      x?: number;
      y?: number;
      w?: number | keyof TOutput;
      h?: number | keyof TOutput;
      spacing?: number;
      alignment?: "start" | "middle" | "end";
    }
  ): BarChartBuilder<TInput, TOutput> {
    // Stack in the bar orientation direction:
    // - Vertical bars (x orientation) stack vertically (y direction)
    // - Horizontal bars (y orientation) stack horizontally (x direction)
    const stackOptions = {
      ...options,
      dir: this.barOrientation === "x" ? ("y" as const) : ("x" as const),
    };

    // Vertical bars, stacking vertically - use stack operator
    return new BarChartBuilder(
      this.builder.flow(
        stack(field as any, stackOptions) as any
      ) as ChartBuilder<TInput, TOutput>,
      this.barOrientation,
      this.markOptions,
      this.markFn
    );
  }
}

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
    const builder = chart(data).flow(spread(options.x, { dir: "x" }));
    return new BarChartBuilder(
      builder as ChartBuilder<T[], T[]>,
      "x",
      {
        h: options.h as string | number | undefined,
        fill: options.fill as string | undefined,
      },
      markFn
    );
  }

  // Horizontal bar chart: if y is provided, spread along y-axis and use w for width
  if (options.y) {
    const builder = chart(data).flow(spread(options.y, { dir: "y" }));
    return new BarChartBuilder(
      builder as ChartBuilder<T[], T[]>,
      "y",
      {
        w: options.w as string | number | undefined,
        fill: options.fill as string | undefined,
      },
      markFn
    );
  }

  // Error if neither x nor y is provided
  // COMBAK: probably this should render a single rectangle at the origin
  throw new Error(
    "bar chart requires either 'x' (for vertical bars) or 'y' (for horizontal bars) encoding channel"
  );
};
