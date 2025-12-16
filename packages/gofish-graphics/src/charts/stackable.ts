export interface Stackable<TInput, TOutput> {
  stack<K extends keyof TOutput>(
    field: K,
    options: {
      x?: number;
      y?: number;
      w?: number | keyof TOutput;
      h?: number | keyof TOutput;
      alignment?: "start" | "middle" | "end";
    }
  ): Stackable<TInput, TOutput>;
}
