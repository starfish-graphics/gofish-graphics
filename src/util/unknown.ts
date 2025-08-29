export type Unknown = {
  kind: "unknown";
  run: (x: number) => number;
};

export const mk = (run: (x: number) => number): Unknown => {
  return { kind: "unknown", run };
};

export const isUnknown = (x: unknown): x is Unknown => {
  return (
    typeof x === "object" &&
    x !== null &&
    "kind" in x &&
    (x as any).kind === "unknown"
  );
};
