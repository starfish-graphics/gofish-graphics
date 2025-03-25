import { CoordinateTransform } from "./coord";

export const arcLengthPolar = (): CoordinateTransform => {
  return {
    transform: ([r, s]: [number, number]) => [r * Math.cos(s / r), r * Math.sin(s / r)],
    isLinear: false,
    /* TODO: double check these domains */
    domain: [
      { min: 0, max: 100, size: 100 },
      { min: 0, max: 2 * Math.PI, size: 2 * Math.PI },
    ],
  };
};
