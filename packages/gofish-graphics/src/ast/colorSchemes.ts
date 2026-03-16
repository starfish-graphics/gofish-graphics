import chroma from "chroma-js";

export type DiscreteScale = { _tag: "discrete"; values: string | string[] | Record<string, string> };
export type ContinuousScale = { _tag: "continuous"; stops: string | string[] };
export type ColorConfig = DiscreteScale | ContinuousScale;

export const discrete = (values: string | string[] | Record<string, string>): DiscreteScale =>
  ({ _tag: "discrete", values });

export const continuous = (stops: string | string[]): ContinuousScale =>
  ({ _tag: "continuous", stops });

type Scheme = { type: "discrete" | "continuous"; colors: string[] };

const schemes: Record<string, Scheme> = {
  tableau10: {
    type: "discrete",
    colors: [
      "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
      "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
    ],
  },
  viridis: {
    type: "continuous",
    colors: ["#440154", "#31688e", "#35b779", "#fde725"],
  },
  blues: {
    type: "continuous",
    colors: ["#f7fbff", "#deebf7", "#9ecae1", "#3182bd", "#08306b"],
  },
  reds: {
    type: "continuous",
    colors: ["#fff5f0", "#fc9272", "#de2d26", "#67000d"],
  },
};

/** Assign a discrete color by cycling through the palette by index. */
export function assignDiscreteColor(
  config: DiscreteScale,
  key: string,
  index: number,
): string {
  const values = config.values;
  if (typeof values === "string") {
    const scheme = schemes[values];
    if (scheme) return scheme.colors[index % scheme.colors.length];
    return values;
  }
  if (Array.isArray(values)) {
    return values[index % values.length];
  }
  return (values as Record<string, string>)[key] ?? "#ccc";
}

/** Assign a continuous color by interpolating at position t in [0, 1]. */
export function assignContinuousColor(config: ContinuousScale, t: number): string {
  const stops = config.stops;
  if (typeof stops === "string") {
    const scheme = schemes[stops];
    if (scheme) return chroma.scale(scheme.colors).mode("lab")(t).hex();
    return stops;
  }
  return chroma.scale(stops).mode("lab")(t).hex();
}
