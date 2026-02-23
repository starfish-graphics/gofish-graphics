import { Layer, Position, rect } from "../lib";

export const testPosition = () => {
  return Position(
    { x: 200, y: 150 },
    [
      rect({
        w: 60,
        h: 40,
        fill: "steelblue",
      }),
    ]
  );
};

export const testMultiplePositions = () => {
  return Layer([
    Position({ x: 100, y: 100 }, [
      rect({ w: 40, h: 40, fill: "red" })
    ]),
    Position({ x: 200, y: 150 }, [
      rect({ w: 40, h: 40, fill: "blue" })
    ]),
    Position({ x: 300, y: 200 }, [
      rect({ w: 40, h: 40, fill: "green" })
    ]),
  ]);
};
