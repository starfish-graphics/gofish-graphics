// Main library exports
export * from "./color";
export * from "./path";
export * from "./util";

// Data utilities
export { value } from "./ast/data";
export { value as v } from "./ast/data";
export { For as map } from "./ast/iterators/for";

// Coordinate Transforms
export { coord } from "./ast/coordinateTransforms/coord";
export { linear } from "./ast/coordinateTransforms/linear";
export { polar } from "./ast/coordinateTransforms/polar";
export { clock } from "./ast/coordinateTransforms/clock";
export { polar_DEPRECATED } from "./ast/coordinateTransforms/polar_DEPRECATED";
export { polarTransposed } from "./ast/coordinateTransforms/polarTransposed";
export { arcLengthPolar } from "./ast/coordinateTransforms/arcLengthPolar";
export { bipolar } from "./ast/coordinateTransforms/bipolar";
export { wavy } from "./ast/coordinateTransforms/wavy";

// Main API
export { gofish as GoFish } from "./ast/gofish";
export { GoFishSolid } from "./ast/GoFishSolid";

/* API v2 */
// Data
export { For } from "./ast/iterators/for";
// export { groupBy } from "./ast/iterators/groupBy";
export { groupBy, sumBy, orderBy, meanBy } from "lodash";

// Shapes
export { ref as Ref } from "./ast/shapes/ref";

// Graphical Operators
export { stack as Stack } from "./ast/graphicalOperators/stack";
export { stackX as StackX } from "./ast/graphicalOperators/stackX";
export { stackY as StackY } from "./ast/graphicalOperators/stackY";
export { spread as Spread } from "./ast/graphicalOperators/spread";
export { spreadX as SpreadX } from "./ast/graphicalOperators/spreadX";
export { spreadY as SpreadY } from "./ast/graphicalOperators/spreadY";
export { layer as Layer } from "./ast/graphicalOperators/layer";
export { wrap as Wrap } from "./ast/graphicalOperators/wrap";
export { connect as Connect } from "./ast/graphicalOperators/connect";
export { connectX as ConnectX } from "./ast/graphicalOperators/connectX";
export { connectY as ConnectY } from "./ast/graphicalOperators/connectY";
export { enclose as Enclose } from "./ast/graphicalOperators/enclose";
export { frame as Frame } from "./ast/graphicalOperators/frame";
export { position as Position } from "./ast/graphicalOperators/position";
export { arrow as Arrow } from "./ast/graphicalOperators/arrow";
export { over as Over, inside as In, xor as Xor, out as Out, atop as Atop, mask as Mask } from "./ast/graphicalOperators/porterDuff";

// Marks (lowercase, from createMark)
export { ellipse } from "./ast/shapes/ellipse";
export { petal } from "./ast/shapes/petal";
export { text } from "./ast/shapes/text";
export { image } from "./ast/shapes/image";

/* Chart Syntax */
export {
  chart as Chart,
  spread,
  stack,
  scatter,
  group,
  derive,
  rect,
  circle,
  select,
  line,
  scaffold,
  area,
  normalize,
  repeat,
  log,
} from "./ast/marks/chart";
export type {
  Mark,
  Operator,
  ChartOptions,
  ChartBuilder,
} from "./ast/marks/chart";
export type { NameableMark } from "./ast/withGoFish";
