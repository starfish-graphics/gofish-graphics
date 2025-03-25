import { CoordinateTransform } from "./coord";

export const bipolar = (fociDistance: number = 100): CoordinateTransform => {
  return {
    transform: ([tau, sigma]: [number, number]) => {
      const denominator = Math.cosh(tau) - Math.cos(sigma);
      const x = (fociDistance * Math.sinh(tau)) / denominator;
      const y = (fociDistance * Math.sin(sigma)) / denominator;

      return [x, y];
    },
    isLinear: false,
    /* TODO: double check these domains */
    domain: [
      { min: -Math.PI, max: Math.PI, size: 2 * Math.PI },
      { min: -Math.PI, max: Math.PI, size: 2 * Math.PI },
    ],
  };
};
