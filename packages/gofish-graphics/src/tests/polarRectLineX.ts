import { color, color6 } from "../color";
import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/shapes/rect";
import { coord } from "../ast/coordinateTransforms/coord";
import { polar_DEPRECATED } from "../ast/coordinateTransforms/polar_DEPRECATED";

/* TODO: these values are going all over the place! */
export const testPolarRectLineX = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height, transform: { x: 100, y: 100 } },
    coord({ transform: polar_DEPRECATED(), grid: true }, [
      rect({
        dims: [
          {
            min: value(20, "test"),
            size: value(30, "test"),
          },
          {
            min: 0,
            size: 5,
          },
        ],
        fill: color6[0],
      }),
      rect({
        dims: [
          {
            min: value(20, "test"),
            size: value(50, "test"),
          },
          {
            min: 0,
            size: 4,
          },
        ],
        fill: color6[1],
      }),
      rect({
        dims: [
          {
            min: value(20, "test"),
            size: value(10, "test"),
          },
          { min: Math.PI / 2, size: 4 },
        ],
        fill: color6[2],
      }),
    ])
  );
