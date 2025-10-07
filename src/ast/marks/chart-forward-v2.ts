/* goal syntax */
// Minimal stubs to make the example typecheck
export type ChartOperator<T = unknown> = (
  state: ChartState<T>
) => ChartState<T>;

export type ChartDirection = "x" | "y";

export interface ChartState<T = unknown> {
  data: T;
  marks: Array<{ type: string; options?: unknown }>;
}

export class ChartBuilder<T> {
  private readonly initialState: ChartState<T>;

  constructor(data: T) {
    this.initialState = { data, marks: [] };
  }

  flow(...operators: ChartOperator<T>[]) {
    let state = this.initialState;
    for (const op of operators) state = op(state);
    return new ChartInstance(state);
  }
}

export class ChartInstance<T> {
  constructor(public readonly state: ChartState<T>) {}
}

export function chart<T>(data: T): ChartBuilder<T> {
  return new ChartBuilder<T>(data);
}

export function spread_by<T = unknown>(
  _channel: string,
  _options?: { dir?: ChartDirection }
): ChartOperator<T> {
  return (state) => state;
}

export function rect<T = unknown>(options?: {
  h?: string | number;
  fill?: string;
}): ChartOperator<T> {
  return (state) => {
    state.marks.push({ type: "rect", options });
    return state;
  };
}

// Minimal dataset stub used by the example
const seafood = [{ lake: "lake1", species: "species1", count: 1 }];
export const chartForwardBar = chart(seafood).flow(
  spread_by("lake", { dir: "x" }),
  rect({ h: "count", fill: "species" })
);
