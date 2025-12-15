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

  render(
    container: HTMLElement,
    {
      w,
      h,
      x,
      y,
      transform,
      debug = false,
      defs,
      axes = false,
    }: {
      w: number;
      h: number;
      x?: number;
      y?: number;
      transform?: { x?: number; y?: number };
      debug?: boolean;
      defs?: JSX.Element[];
      axes?: boolean;
    }
  ) {
    return this.mark().render(container, {
      w,
      h,
      x,
      y,
      transform,
      debug,
      defs,
      axes,
    });
  }

  stack<K extends keyof TOutput>(
    field: K,
    options?: {
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

export const barChart = <T extends Record<string, any>>(
  data: T[],
  options: {
    x: keyof T;
    y: keyof T;
    orientation?: "x" | "y";
    fill?: keyof T | string;
    mark?: (options: {
      h?: string | number | keyof T;
      w?: string | number | keyof T;
      fill?: string | keyof T;
      [key: string]: any;
    }) => Mark<T | T[] | { item: T | T[]; key: number | string }>;
  }
) => {
  // Both x and y are required
  if (options.x === undefined || options.y === undefined) {
    throw new Error("bar chart requires both 'x' and 'y' encoding channels");
  }

  const markFn = options.mark ?? rect;
  const orientation = options.orientation ?? "y";

  // Vertical bar chart (orientation: "y"): spread along x-axis using x field, height from y field
  if (orientation === "y") {
    const builder = chart(data).flow(spread(options.x, { dir: "x" }));
    return new BarChartBuilder(
      builder as ChartBuilder<T[], T[]>,
      "x",
      {
        h: options.y as string | number,
        fill: options.fill as string | undefined,
      },
      markFn
    );
  }

  // Horizontal bar chart (orientation: "x"): spread along y-axis using y field, width from x field
  if (orientation === "x") {
    const builder = chart(data).flow(spread(options.y, { dir: "y" }));
    return new BarChartBuilder(
      builder as ChartBuilder<T[], T[]>,
      "y",
      {
        w: options.x as string | number,
        fill: options.fill as string | undefined,
      },
      markFn
    );
  }

  throw new Error(
    `bar chart orientation must be either 'x' or 'y', got '${orientation}'`
  );
};
