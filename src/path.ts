export type Point = [number, number];
export type LineSegment = {
  type: "line";
  points: [Point, Point];
};
export type BezierCurve = {
  type: "bezier";
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
};

export type PathSegment = LineSegment | BezierCurve;

export type Path = PathSegment[];

export const segmentToSVG = (segment: PathSegment): string => {
  if (segment.type === "line") {
    const [[x1, y1], [x2, y2]] = segment.points;
    return `L${x2},${y2}`;
  } else {
    const { control1, control2, end } = segment;
    return `C${control1[0]},${control1[1]} ${control2[0]},${control2[1]} ${end[0]},${end[1]}`;
  }
};

export const pathToSVGPath = (path: Path): string => {
  const firstSegment = path[0];
  const startPoint = firstSegment.type === "line" ? firstSegment.points[0] : firstSegment.start;
  return `M${startPoint[0]},${startPoint[1]} ${path.map(segmentToSVG).join(" ")} Z`;
};
