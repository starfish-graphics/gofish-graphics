import { CoordinateTransform } from "./coord";

/* TODO: just compose polar and a transposed space... */
export const polarTransposed = (): CoordinateTransform => {
  return {
    transform: ([theta, r]: [number, number]) => [r * Math.sin(theta), r * Math.cos(theta)],
    isLinear: false,
  };
};
