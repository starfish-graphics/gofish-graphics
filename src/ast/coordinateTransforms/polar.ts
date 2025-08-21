import { CoordinateTransform } from "./coord";

export const polar = (): CoordinateTransform => {
  return {
    type: "polar",
    transform: ([theta, r]: [number, number]) => [
      // r * Math.cos(-theta + Math.PI / 2),
      // r * Math.sin(-theta + Math.PI / 2),
      r * Math.cos(-theta + Math.PI / 2),
      r * Math.sin(-theta + Math.PI / 2),
    ],
    domain: [
      { min: 0, max: 2 * Math.PI, size: 2 * Math.PI },
      { min: 0, max: 100, size: 100 },
    ],
  };
};
