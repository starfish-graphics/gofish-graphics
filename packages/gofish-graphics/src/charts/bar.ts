import {
  chart,
  rect,
  spread,
  stack,
  Mark,
  ChartBuilder,
  Operator,
} from "../lib";
import { Stackable } from "./stackable";

// Wrapper class that adds .stack() method to ChartBuilder
class BarChartBuilder<TInput, TOutput = TInput>
  implements Stackable<TInput, TOutput>
{
  private builder: ChartBuilder<TInput, TOutput>;
  private readonly barOrientation: "x" | "y";

  constructor(
    builder: ChartBuilder<TInput, TOutput>,
    barOrientation: "x" | "y"
  ) {
    this.builder = builder;
    this.barOrientation = barOrientation;
  }

  // Delegate all ChartBuilder methods
  flow<T1>(op1: Operator<TInput, T1>): BarChartBuilder<TInput, T1> {
    return new BarChartBuilder(
      this.builder.flow(op1) as ChartBuilder<TInput, T1>,
      this.barOrientation
    );
  }

  as(name: string): BarChartBuilder<TInput, TOutput> {
    return new BarChartBuilder(this.builder.as(name), this.barOrientation);
  }

  async resolve() {
    return this.builder.resolve();
  }

  async render(
    ...args: Parameters<ChartBuilder<TInput, TOutput>["render"]>
  ): Promise<ReturnType<ChartBuilder<TInput, TOutput>["render"]>> {
    return this.builder.render(...args);
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
      dir: this.barOrientation,
    };

    // stack() returns Operator<T[], T[]>, and in bar chart context TOutput is T[]
    // TypeScript has trouble with overload resolution here, so we bypass it
    const builderAny = this.builder as any;
    const stackOp = stack(field as any, stackOptions);
    return new BarChartBuilder(
      builderAny.flow(stackOp) as ChartBuilder<TInput, TOutput>,
      this.barOrientation
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
    const builder = chart(data)
      .flow(spread(options.x, { dir: "x" }))
      .mark(
        markFn({
          h: options.y as string | number,
          fill: options.fill as string | undefined,
        })
      );
    return new BarChartBuilder(builder as ChartBuilder<T[], T[]>, orientation);
  }

  // Horizontal bar chart (orientation: "x"): spread along y-axis using y field, width from x field
  if (orientation === "x") {
    const builder = chart(data)
      .flow(spread(options.y, { dir: "y" }))
      .mark(
        markFn({
          w: options.x as string | number,
          fill: options.fill as string | undefined,
        })
      );
    return new BarChartBuilder(builder as ChartBuilder<T[], T[]>, orientation);
  }

  throw new Error(
    `bar chart orientation must be either 'x' or 'y', got '${orientation}'`
  );
};
