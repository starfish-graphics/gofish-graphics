import { CoordinateTransform } from "./coord";

export const linear = (): CoordinateTransform => {
  return {
    transform: ([x, y]: [number, number]) => [x, y],
    isLinear: true,
    domain: [
      { min: 0, max: 100, size: 100 },
      { min: 0, max: 100, size: 100 },
    ],
  };
};
