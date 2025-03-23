import { CoordinateTransform } from "./coord";

export const polar = (): CoordinateTransform => {
  return {
    transform: ([r, theta]: [number, number]) => [r * Math.cos(theta), r * Math.sin(theta)],
    isLinear: false,
  };
};
