/* import { layout } from "../components/layout";
import { rect } from "../components/rect";
import { stack } from "../components/stack";
import { d as $d } from "../components/data"; */

import { value } from "../ast/data";
import { gofish } from "../ast/gofish";
import { rect } from "../ast/shapes/rect";
import { stack } from "../ast/graphicalOperators/stack";
import { color, color6, white } from "../color";
import { catchData } from "../data/catch";
import _ from "lodash";
import { stackX } from "../ast/graphicalOperators/stackX";
import { frame } from "../ast/graphicalOperators/frame";
import { connectX } from "../ast/graphicalOperators/connectX";
import { ref } from "../ast/shapes/ref";
import { mix } from "spectral.js";
import { enclose } from "../ast/graphicalOperators/enclose";
const fishColors = {
  Bass: color.blue[5],
  Trout: color.red[5],
  Catfish: color.green[5],
  Perch: color.yellow[5],
  Salmon: color.purple[5],
};

export const testStacking = (size: { width: number; height: number }) =>
  gofish(
    { width: size.width, height: size.height },
    frame([
      enclose({}, [
        stackX({ spacing: 64, sharedScale: true, alignment: "middle" }, [
          rect({ name: "1", w: 32, h: 32 }),
          rect({ name: "2", w: 32, h: 64 }),
          rect({ name: "3", w: 32, h: 40 }),
          // rect({ w: 32, h: 32 }),
          // rect({ w: 32, h: 32 }),
        ]),
      ]),

      // // connectX({ opacity: 0.7 }, [ref("1"), ref("2"), ref("3")]),
      // enclose({}, [ref("1"), ref("2"), ref("3")]),
    ])
  );
