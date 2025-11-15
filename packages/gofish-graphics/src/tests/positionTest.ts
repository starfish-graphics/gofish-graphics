import { rect, position, layer } from "../lib";

export const testPosition = () => {
  return position(
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
  return layer([
    position({ x: 100, y: 100 }, [
      rect({ w: 40, h: 40, fill: "red" })
    ]),
    position({ x: 200, y: 150 }, [
      rect({ w: 40, h: 40, fill: "blue" })
    ]),
    position({ x: 300, y: 200 }, [
      rect({ w: 40, h: 40, fill: "green" })
    ]),
  ]);
};