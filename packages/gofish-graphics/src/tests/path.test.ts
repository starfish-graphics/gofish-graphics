/**
 * Tests for adaptive resampling in path transformations.
 * 
 * Compares adaptive resampling against uniform fine subdivision
 * to verify that adaptive resampling produces similar visual quality
 * with fewer segments.
 */

import { Path, Point, segment, curve, transformPath, subdividePath } from "../path";
import { polar } from "../ast/coordinateTransforms/polar";

/**
 * Samples points along a path by evaluating segments at regular intervals.
 * Used to compare paths by sampling and measuring distances.
 */
function samplePathPoints(path: Path, numSamples: number): Point[] {
  const points: Point[] = [];
  const totalSegments = path.length;
  
  if (totalSegments === 0) return points;
  
  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const segmentIndex = Math.floor(t * totalSegments);
    const segmentT = (t * totalSegments) - segmentIndex;
    
    if (segmentIndex >= totalSegments) {
      // Use last segment's end point
      const lastSeg = path[totalSegments - 1];
      const endPoint = lastSeg.type === "line" ? lastSeg.points[1] : lastSeg.end;
      points.push(endPoint);
    } else {
      const seg = path[segmentIndex];
      if (seg.type === "line") {
        const [p0, p1] = seg.points;
        const x = p0[0] + (p1[0] - p0[0]) * segmentT;
        const y = p0[1] + (p1[1] - p0[1]) * segmentT;
        points.push([x, y]);
      } else {
        // For bezier, use de Casteljau at segmentT
        // Simplified: just use linear interpolation for testing
        const x = seg.start[0] + (seg.end[0] - seg.start[0]) * segmentT;
        const y = seg.start[1] + (seg.end[1] - seg.start[1]) * segmentT;
        points.push([x, y]);
      }
    }
  }
  
  return points;
}

/**
 * Computes maximum deviation between two paths by sampling points.
 */
function maxDeviation(path1: Path, path2: Path, numSamples: number = 100): number {
  const points1 = samplePathPoints(path1, numSamples);
  const points2 = samplePathPoints(path2, numSamples);
  
  let maxDist = 0;
  for (let i = 0; i < Math.min(points1.length, points2.length); i++) {
    const [x1, y1] = points1[i];
    const [x2, y2] = points2[i];
    const dist = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    maxDist = Math.max(maxDist, dist);
  }
  
  return maxDist;
}

/**
 * Test: Line segments under polar transform
 */
function testLineSegmentsPolar() {
  console.log("Test 1: Line segments under polar transform");
  
  // Create a line path in polar coordinates (theta, r)
  const linePath: Path = [
    segment([0, 10], [Math.PI / 2, 50]), // From theta=0, r=10 to theta=π/2, r=50
  ];
  
  const space = polar();
  
  // Adaptive resampling
  const adaptiveResult = transformPath(linePath, space, { resample: true });
  
  // Uniform subdivision (reference)
  const uniformResult = transformPath(subdividePath(linePath, 1000), space);
  
  console.log(`  Adaptive segments: ${adaptiveResult.length}`);
  console.log(`  Uniform segments: ${uniformResult.length}`);
  
  const deviation = maxDeviation(adaptiveResult, uniformResult, 100);
  console.log(`  Max deviation: ${deviation.toFixed(4)}`);
  
  // Adaptive should use fewer segments but still be close
  const fewerSegments = adaptiveResult.length < uniformResult.length;
  const deviationOk = deviation < 10;
  const passed = fewerSegments && deviationOk;
  
  if (!passed) {
    console.log(`  ✗ FAILED:`);
    if (!fewerSegments) {
      console.log(`    - Adaptive resampling produced ${adaptiveResult.length} segments, but uniform subdivision produced ${uniformResult.length}.`);
      console.log(`      Expected adaptive to use fewer segments (it should be more efficient).`);
    }
    if (!deviationOk) {
      console.log(`    - Maximum deviation ${deviation.toFixed(4)} exceeds threshold of 10.`);
      console.log(`      The adaptive resampling result differs too much from the reference.`);
      console.log(`      This may indicate the resampling algorithm needs tuning (delta2, maxDepth, etc.).`);
    }
  } else {
    console.log(`  ✓ PASSED`);
  }
  console.log();
  
  return passed;
}

/**
 * Test: Bezier curves under polar transform
 */
function testBezierCurvesPolar() {
  console.log("Test 2: Bezier curves under polar transform");
  
  // Create a bezier path in polar coordinates
  const bezierPath: Path = [
    curve(
      [0, 10],           // start: theta=0, r=10
      [Math.PI / 6, 20], // control1
      [Math.PI / 3, 40], // control2
      [Math.PI / 2, 50]  // end: theta=π/2, r=50
    ),
  ];
  
  const space = polar();
  
  // Adaptive resampling
  const adaptiveResult = transformPath(bezierPath, space, { resample: true });
  
  // Uniform subdivision (reference)
  const uniformResult = transformPath(subdividePath(bezierPath, 1000), space);
  
  console.log(`  Adaptive segments: ${adaptiveResult.length}`);
  console.log(`  Uniform segments: ${uniformResult.length}`);
  
  const deviation = maxDeviation(adaptiveResult, uniformResult, 100);
  console.log(`  Max deviation: ${deviation.toFixed(4)}`);
  
  const fewerSegments = adaptiveResult.length < uniformResult.length;
  const deviationOk = deviation < 10;
  const passed = fewerSegments && deviationOk;
  
  if (!passed) {
    console.log(`  ✗ FAILED:`);
    if (!fewerSegments) {
      console.log(`    - Adaptive resampling produced ${adaptiveResult.length} segments, but uniform subdivision produced ${uniformResult.length}.`);
      console.log(`      Expected adaptive to use fewer segments (it should be more efficient).`);
    }
    if (!deviationOk) {
      console.log(`    - Maximum deviation ${deviation.toFixed(4)} exceeds threshold of 10.`);
      console.log(`      The adaptive resampling result differs too much from the reference.`);
      console.log(`      This may indicate the resampling algorithm needs tuning (delta2, maxDepth, etc.).`);
    }
  } else {
    console.log(`  ✓ PASSED`);
  }
  console.log();
  
  return passed;
}

/**
 * Test: Mixed paths (lines and beziers)
 */
function testMixedPaths() {
  console.log("Test 3: Mixed paths (lines and beziers)");
  
  const mixedPath: Path = [
    segment([0, 10], [Math.PI / 4, 30]),
    curve(
      [Math.PI / 4, 30],
      [Math.PI / 3, 35],
      [Math.PI / 2, 40],
      [Math.PI, 50]
    ),
  ];
  
  const space = polar();
  
  // Adaptive resampling
  const adaptiveResult = transformPath(mixedPath, space, { resample: true });
  
  // Uniform subdivision (reference)
  const uniformResult = transformPath(subdividePath(mixedPath, 1000), space);
  
  console.log(`  Adaptive segments: ${adaptiveResult.length}`);
  console.log(`  Uniform segments: ${uniformResult.length}`);
  
  const deviation = maxDeviation(adaptiveResult, uniformResult, 100);
  console.log(`  Max deviation: ${deviation.toFixed(4)}`);
  
  const fewerSegments = adaptiveResult.length < uniformResult.length;
  const deviationOk = deviation < 10;
  const passed = fewerSegments && deviationOk;
  
  if (!passed) {
    console.log(`  ✗ FAILED:`);
    if (!fewerSegments) {
      console.log(`    - Adaptive resampling produced ${adaptiveResult.length} segments, but uniform subdivision produced ${uniformResult.length}.`);
      console.log(`      Expected adaptive to use fewer segments (it should be more efficient).`);
    }
    if (!deviationOk) {
      console.log(`    - Maximum deviation ${deviation.toFixed(4)} exceeds threshold of 10.`);
      console.log(`      The adaptive resampling result differs too much from the reference.`);
      console.log(`      This may indicate the resampling algorithm needs tuning (delta2, maxDepth, etc.).`);
    }
  } else {
    console.log(`  ✓ PASSED`);
  }
  console.log();
  
  return passed;
}

/**
 * Test: Edge cases
 */
function testEdgeCases() {
  console.log("Test 4: Edge cases");
  
  const space = polar();
  let allPassed = true;
  
  // Empty path
  const emptyPath: Path = [];
  const emptyResult = transformPath(emptyPath, space, { resample: true });
  const emptyPassed = emptyResult.length === 0;
  if (!emptyPassed) {
    console.log(`  Empty path: ✗ FAILED`);
    console.log(`    - Expected empty path to return 0 segments, but got ${emptyResult.length}`);
  } else {
    console.log(`  Empty path: ✓ PASSED`);
  }
  allPassed = allPassed && emptyPassed;
  
  // Single segment path
  const singlePath: Path = [segment([0, 10], [Math.PI / 4, 20])];
  const singleResult = transformPath(singlePath, space, { resample: true });
  const singlePassed = singleResult.length > 0;
  if (!singlePassed) {
    console.log(`  Single segment: ✗ FAILED`);
    console.log(`    - Expected single segment path to produce at least 1 segment, but got ${singleResult.length}`);
    console.log(`    - This suggests the resampling algorithm may be filtering out valid segments.`);
  } else {
    console.log(`  Single segment: ✓ PASSED`);
  }
  allPassed = allPassed && singlePassed;
  
  // Very short segment
  const shortPath: Path = [segment([0, 10], [0.001, 10.001])];
  const shortResult = transformPath(shortPath, space, { resample: true });
  const shortPassed = shortResult.length > 0;
  if (!shortPassed) {
    console.log(`  Very short segment: ✗ FAILED`);
    console.log(`    - Expected very short segment to produce at least 1 segment, but got ${shortResult.length}`);
    console.log(`    - This suggests the resampling algorithm may be incorrectly filtering short segments.`);
  } else {
    console.log(`  Very short segment: ✓ PASSED`);
  }
  allPassed = allPassed && shortPassed;
  
  if (allPassed) {
    console.log(`  ✓ ALL PASSED`);
  } else {
    console.log(`  ✗ SOME FAILED`);
  }
  console.log();
  
  return allPassed;
}

/**
 * Run all tests
 */
export function runTests() {
  console.log("Running adaptive resampling tests...\n");
  
  const results = [
    testLineSegmentsPolar(),
    testBezierCurvesPolar(),
    testMixedPaths(),
    testEdgeCases(),
  ];
  
  const allPassed = results.every((r) => r);
  
  console.log();
  if (allPassed) {
    console.log("✓ All tests passed!");
  } else {
    console.log("✗ Some tests failed");
    console.log("\nSummary:");
    const testNames = [
      "Line segments under polar transform",
      "Bezier curves under polar transform",
      "Mixed paths (lines and beziers)",
      "Edge cases"
    ];
    results.forEach((passed, i) => {
      console.log(`  ${passed ? "✓" : "✗"} ${testNames[i]}`);
    });
    console.log("\nTroubleshooting:");
    console.log("  - If adaptive resampling uses more segments than uniform, check the subdivision criteria");
    console.log("  - If deviation is too high, try adjusting delta2 or maxDepth in adaptive-resampling.ts");
    console.log("  - If edge cases fail, check that empty/short paths are handled correctly");
  }
  
  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  runTests();
}
