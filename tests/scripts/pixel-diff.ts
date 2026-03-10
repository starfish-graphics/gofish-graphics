/**
 * Pixel-level image comparison using pixelmatch + pngjs.
 */

import { readFileSync } from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface PixelDiffResult {
  diffPng: Buffer;
  diffPercent: number;
}

function readPng(path: string): PNG {
  const buf = readFileSync(path);
  return PNG.sync.read(buf);
}

function padToSize(
  img: PNG,
  width: number,
  height: number
): { data: Buffer; width: number; height: number } {
  if (img.width === width && img.height === height) {
    return { data: img.data, width, height };
  }
  const padded = Buffer.alloc(width * height * 4, 0);
  for (let y = 0; y < img.height && y < height; y++) {
    for (let x = 0; x < img.width && x < width; x++) {
      const srcIdx = (y * img.width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      padded[dstIdx] = img.data[srcIdx];
      padded[dstIdx + 1] = img.data[srcIdx + 1];
      padded[dstIdx + 2] = img.data[srcIdx + 2];
      padded[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }
  return { data: padded, width, height };
}

/**
 * Compute pixel diff between two PNG files.
 * Returns null if either file doesn't exist or can't be read.
 */
export function computePixelDiff(
  beforePath: string,
  afterPath: string
): PixelDiffResult | null {
  let before: PNG, after: PNG;
  try {
    before = readPng(beforePath);
    after = readPng(afterPath);
  } catch {
    return null;
  }

  const width = Math.max(before.width, after.width);
  const height = Math.max(before.height, after.height);

  const beforePadded = padToSize(before, width, height);
  const afterPadded = padToSize(after, width, height);

  const diffData = Buffer.alloc(width * height * 4);
  const numDiff = pixelmatch(
    beforePadded.data,
    afterPadded.data,
    diffData,
    width,
    height,
    { threshold: 0 }
  );

  const totalPixels = width * height;
  const diffPercent = totalPixels > 0 ? (numDiff / totalPixels) * 100 : 0;

  const diffPng = new PNG({ width, height });
  diffPng.data = diffData;
  const diffBuf = PNG.sync.write(diffPng);

  return { diffPng: diffBuf, diffPercent };
}
