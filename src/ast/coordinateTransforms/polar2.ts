import { CoordinateTransform } from "./coord";

export const polar2 = (): CoordinateTransform => {
  return {
    type: "polar2",
    transform: ([theta, r]: [number, number]) => [r * Math.cos(theta), r * Math.sin(theta)],
    domain: [
      { min: 0, max: 2 * Math.PI, size: 2 * Math.PI },
      { min: 0, max: 100, size: 100 },
    ],
  };
};
