// Main library exports
export * from "./color";
export * from "./path";
export * from "./util";

// Data utilities
export { value } from "./ast/data";
export { For as map } from "./ast/iterators/for";

// Marks
// export { rect } from "./ast/shapes/rect";
export { ellipse } from "./ast/shapes/ellipse";
export { petal } from "./ast/shapes/petal";
export { ref } from "./ast/shapes/ref";

// Graphical Operators
// export { stack } from "./ast/graphicalOperators/stack";
export { stackX } from "./ast/graphicalOperators/stackX";
export { stackY } from "./ast/graphicalOperators/stackY";
export { layer } from "./ast/graphicalOperators/layer";
export {
  getLayerContext,
  resetLayerContext,
} from "./ast/graphicalOperators/frame";
export { wrap } from "./ast/graphicalOperators/wrap";
export { connect } from "./ast/graphicalOperators/connect";
export { connectX } from "./ast/graphicalOperators/connectX";
export { connectY } from "./ast/graphicalOperators/connectY";
export { enclose } from "./ast/graphicalOperators/enclose";
export { frame } from "./ast/graphicalOperators/frame";
export { position } from "./ast/graphicalOperators/position";

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
export { gofish } from "./ast/gofish";
export { GoFishSolid } from "./ast/GoFishSolid";

/* API v2 */
// Data
export { value as v } from "./ast/data";
export { For } from "./ast/iterators/for";
// export { groupBy } from "./ast/iterators/groupBy";
export { groupBy, sumBy, orderBy, meanBy } from "lodash";

// Shapes
export { rect as Rect } from "./ast/shapes/rect";
export { ellipse as Ellipse } from "./ast/shapes/ellipse";
export { petal as Petal } from "./ast/shapes/petal";
export { ref as Ref } from "./ast/shapes/ref";

// Graphical Operators
export { stack as Stack } from "./ast/graphicalOperators/stack";
export { stackX as StackX } from "./ast/graphicalOperators/stackX";
export { stackY as StackY } from "./ast/graphicalOperators/stackY";
export { layer as Layer } from "./ast/graphicalOperators/layer";
export { wrap as Wrap } from "./ast/graphicalOperators/wrap";
export { connect as Connect } from "./ast/graphicalOperators/connect";
export { connectX as ConnectX } from "./ast/graphicalOperators/connectX";
export { connectY as ConnectY } from "./ast/graphicalOperators/connectY";
export { enclose as Enclose } from "./ast/graphicalOperators/enclose";
export { frame as Frame } from "./ast/graphicalOperators/frame";
export { position as Position } from "./ast/graphicalOperators/position";

// Coordinate Transforms
export { coord as Coord } from "./ast/coordinateTransforms/coord";
export { linear as Linear } from "./ast/coordinateTransforms/linear";
export { polar as Polar } from "./ast/coordinateTransforms/polar";
export { polar_DEPRECATED as Polar_DEPRECATED } from "./ast/coordinateTransforms/polar_DEPRECATED";
export { polarTransposed as PolarTransposed } from "./ast/coordinateTransforms/polarTransposed";
export { arcLengthPolar as ArcLengthPolar } from "./ast/coordinateTransforms/arcLengthPolar";
export { bipolar as Bipolar } from "./ast/coordinateTransforms/bipolar";
export { wavy as Wavy } from "./ast/coordinateTransforms/wavy";

/* Chart Syntax */
export {
  chart,
  spread,
  stack,
  scatter,
  foreach,
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
