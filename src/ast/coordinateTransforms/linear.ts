import { CoordinateTransform } from "./coord";

export const linear = (): CoordinateTransform => {
  return {
    type: "linear",
    transform: ([x, y]: [number, number]) => [x, y],
    domain: [
      { min: 0, max: 100, size: 100 },
      { min: 0, max: 100, size: 100 },
    ],
  };
};
