import { CoordinateTransform } from "./coord";

// Clock coordinate system: 0° is at 12 o'clock (pointing up)
// theta increases clockwise (standard clock direction)
export const clock = (): CoordinateTransform => {
  return {
    type: "clock",
    transform: ([theta, r]: [number, number]) => [
      r * Math.cos(-theta + Math.PI / 2),
      r * Math.sin(-theta + Math.PI / 2),
    ],
    domain: [
      { min: 0, max: 2 * Math.PI, size: 2 * Math.PI },
      { min: 0, max: 100, size: 100 },
    ],
  };
};
