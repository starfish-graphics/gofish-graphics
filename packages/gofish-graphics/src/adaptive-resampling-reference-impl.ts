/**
 * Adaptive resampling algorithm for lines under coordinate transformations.
 *
 * Based on D3's adaptive resampling algorithm:
 * https://github.com/d3/d3-geo/blob/8c53a90ae70c94bace73ecb02f2c792c649c86ba/src/projection/resample.js
 * https://observablehq.com/@d3/adaptive-sampling
 *
 * This implementation is a generalized version (not specialized to spherical coordinates) and
 * written in a more readable and functional style.
 *
 * This implementation subdivides line segments adaptively based on:
 * - Projected distance threshold (delta2)
 * - Perpendicular distance from midpoint
 * - Midpoint proximity to endpoints
 * - Source space distance threshold
 */

export interface ResamplingOptions<T> {
  /** Squared distance threshold in projected space */
  delta2: number;
  /** Maximum recursion depth */
  maxDepth: number;
  /** Function to compute midpoint in source space */
  sourceMidpoint: (p0: T, p1: T) => T;
  /** Function to compute distance in source space */
  sourceDistance: (p0: T, p1: T) => number;
  /** Minimum source distance threshold for forced subdivision */
  minSourceDistance: number;
}

/**
 * Creates a resampling function that adaptively subdivides a line based on
 * how it appears after transformation.
 *
 * @param transform Function that transforms a source point to [x, y] in projected space
 * @param options Resampling configuration options
 * @returns Function that takes source points and returns resampled transformed points
 */
export function resample<T>(
  transform: (point: T) => [number, number],
  options: ResamplingOptions<T>
): (points: T[]) => [number, number][] {
  const {
    delta2,
    maxDepth,
    sourceMidpoint,
    sourceDistance,
    minSourceDistance,
  } = options;

  /**
   * Recursively resamples a line segment between two points.
   *
   * @param s0 Source point at start of segment
   * @param s1 Source point at end of segment
   * @param depth Current recursion depth
   * @param result Array to accumulate result points
   */
  function resampleSegment(
    s0: T,
    s1: T,
    depth: number,
    result: [number, number][]
  ): void {
    const p0 = transform(s0);
    const p1 = transform(s1);

    const [x0, y0] = p0;
    const [x1, y1] = p1;

    const dx = x1 - x0;
    const dy = y1 - y0;
    const d2 = dx * dx + dy * dy; // squared distance in projected space

    // Check if we need to subdivide
    if (d2 > 4 * delta2 && depth > 0) {
      // Calculate midpoint in source space
      const sMid = sourceMidpoint(s0, s1);
      const pMid = transform(sMid);
      const [x2, y2] = pMid;

      // Vector from start to midpoint
      const dx2 = x2 - x0;
      const dy2 = y2 - y0;

      // Perpendicular distance (cross product)
      const dz = dy * dx2 - dx * dy2;

      // Check subdivision criteria:
      // 1. Perpendicular distance exceeds threshold
      const perpendicularCheck = (dz * dz) / d2 > delta2;

      // 2. Midpoint is too close to an endpoint (not near center)
      const midpointCheck = Math.abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3;

      // 3. Source space distance exceeds threshold
      const sourceDistanceCheck = sourceDistance(s0, s1) > minSourceDistance;

      if (perpendicularCheck || midpointCheck || sourceDistanceCheck) {
        // Recursively process first half
        resampleSegment(s0, sMid, depth - 1, result);

        // Add midpoint
        result.push(pMid);

        // Recursively process second half
        resampleSegment(sMid, s1, depth - 1, result);
      }
    }
  }

  return (points: T[]): [number, number][] => {
    if (points.length === 0) return [];
    if (points.length === 1) return [transform(points[0])];

    const result: [number, number][] = [];

    // Add first point
    result.push(transform(points[0]));

    // Process each segment
    for (let i = 0; i < points.length - 1; i++) {
      resampleSegment(points[i], points[i + 1], maxDepth, result);
      // Add the endpoint of the segment
      result.push(transform(points[i + 1]));
    }

    return result;
  };
}
