import { CoordinateTransform } from "./coord";

export const linear = (): CoordinateTransform => {
  return {
    transform: ([x, y]: [number, number]) => [x, y],
    isLinear: true,
  };
};
