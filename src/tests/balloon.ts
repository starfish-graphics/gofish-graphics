/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/marks/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6 } from "../color";
import { fish } from "../data/fishVaried";
import _ from "lodash";
import { layer } from "../ast/graphicalOperators/layer";
import { ellipse } from "../ast/marks/ellipse";

/*  From Claude :)
<!-- Balloon body (ellipse) -->
<ellipse cx="200" cy="150" rx="120" ry="150" fill="#ff5555" />

<!-- Balloon highlight (smaller ellipse) -->
<ellipse cx="170" cy="110" rx="35" ry="55" fill="#ff8888" />

<!-- Balloon knot (small ellipse) -->
<ellipse cx="200" cy="310" rx="15" ry="10" fill="#cc4444" />



<!-- Balloon bottom neck (rectangle) -->
<rect x="180" y="300" width="40" height="20" fill="#ee4444" rx="15" ry="10" />

<!-- Balloon tie (small rectangles) -->
<rect x="192" y="305" width="16" height="12" fill="#cc4444" rx="5" ry="5" />
*/

export const testBalloon = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    layer({ transform: { scale: { x: 0.4, y: 0.4 } } }, [
      ellipse({ cx: 150, cy: 150, w: 240, h: 300, fill: color.red[4] }),
      ellipse({ cx: 120, cy: 110, w: 70, h: 110, fill: color.red[3] }),
      rect({ cx: 110 + 80 / 2, cy: 300 + 40 / 2, w: 80, h: 40, fill: color.red[5], rx: 30, ry: 20 }),
      rect({ cx: 134 + 32 / 2, cy: 308 + 24 / 2, w: 50, h: 24, fill: color.red[6], rx: 20, ry: 10 }),
    ])
  );
