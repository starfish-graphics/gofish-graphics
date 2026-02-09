import * as Monotonic from "../../util/monotonic";
import { computeAesthetic } from "../../util";
import { interval } from "../../util/interval";
import { GoFishNode } from "../_node";
import { getValue, inferEmbedded, isAesthetic, isValue } from "../data";
import { Dimensions, elaborateDims, FancyDims, Transform } from "../dims";
import {
  DIFFERENCE,
  ORDINAL,
  POSITION,
  SIZE,
  UNDEFINED,
} from "../underlyingSpace";
import { createMark } from "../withGoFish";

type ImageDimensions = {
  width: number;
  height: number;
};

const imageDimensionsCache = new Map<string, ImageDimensions>();
const pendingImageLoads = new Set<string>();

const parseSvgLength = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parseSvgViewBox = (value: string | undefined): ImageDimensions | undefined => {
  if (!value) return undefined;
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map((part) => Number.parseFloat(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return undefined;
  }
  const width = parts[2];
  const height = parts[3];
  if (width <= 0 || height <= 0) return undefined;
  return { width, height };
};

const parseSvgDataUriDimensions = (href: string): ImageDimensions | undefined => {
  if (!href.startsWith("data:image/svg+xml")) return undefined;

  const commaIndex = href.indexOf(",");
  if (commaIndex === -1) return undefined;

  const metadata = href.slice(0, commaIndex);
  const dataPayload = href.slice(commaIndex + 1);

  let svgText: string;
  try {
    if (metadata.includes(";base64")) {
      if (typeof atob !== "function") return undefined;
      svgText = atob(dataPayload);
    } else {
      svgText = decodeURIComponent(dataPayload);
    }
  } catch {
    return undefined;
  }

  const widthMatch = svgText.match(/\bwidth\s*=\s*"([^"]+)"/i);
  const heightMatch = svgText.match(/\bheight\s*=\s*"([^"]+)"/i);
  const width = parseSvgLength(widthMatch?.[1]);
  const height = parseSvgLength(heightMatch?.[1]);

  if (width !== undefined && height !== undefined) {
    return { width, height };
  }

  const viewBoxMatch = svgText.match(/\bviewBox\s*=\s*"([^"]+)"/i);
  return parseSvgViewBox(viewBoxMatch?.[1]);
};

const cacheImageDimensions = (href: string, dimensions: ImageDimensions): void => {
  if (dimensions.width > 0 && dimensions.height > 0) {
    imageDimensionsCache.set(href, dimensions);
  }
};

const startImageProbe = (href: string): void => {
  if (
    typeof globalThis.Image === "undefined" ||
    imageDimensionsCache.has(href) ||
    pendingImageLoads.has(href)
  ) {
    return;
  }

  pendingImageLoads.add(href);
  const image = new globalThis.Image();

  image.onload = () => {
    cacheImageDimensions(href, {
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    pendingImageLoads.delete(href);
  };

  image.onerror = () => {
    pendingImageLoads.delete(href);
  };

  image.src = href;
};

const resolveIntrinsicDimensions = (href: string): ImageDimensions | undefined => {
  const cached = imageDimensionsCache.get(href);
  if (cached) return cached;

  const parsedSvgDimensions = parseSvgDataUriDimensions(href);
  if (parsedSvgDimensions) {
    cacheImageDimensions(href, parsedSvgDimensions);
    return parsedSvgDimensions;
  }

  startImageProbe(href);
  return undefined;
};

const resolveRenderedDimensions = (
  requestedWidth: number | undefined,
  requestedHeight: number | undefined,
  intrinsicDimensions: ImageDimensions | undefined
): ImageDimensions => {
  const hasIntrinsicAspectRatio =
    intrinsicDimensions !== undefined &&
    intrinsicDimensions.width > 0 &&
    intrinsicDimensions.height > 0;

  if (requestedWidth !== undefined && requestedHeight !== undefined) {
    return { width: requestedWidth, height: requestedHeight };
  }

  if (requestedWidth !== undefined) {
    if (hasIntrinsicAspectRatio) {
      return {
        width: requestedWidth,
        height:
          (requestedWidth * intrinsicDimensions!.height) /
          intrinsicDimensions!.width,
      };
    }
    return { width: requestedWidth, height: requestedWidth };
  }

  if (requestedHeight !== undefined) {
    if (hasIntrinsicAspectRatio) {
      return {
        width:
          (requestedHeight * intrinsicDimensions!.width) /
          intrinsicDimensions!.height,
        height: requestedHeight,
      };
    }
    return { width: requestedHeight, height: requestedHeight };
  }

  if (intrinsicDimensions) {
    return intrinsicDimensions;
  }

  return { width: 0, height: 0 };
};

export const Image = ({
  key,
  name,
  href,
  filter,
  opacity,
  preserveAspectRatio = "xMidYMid meet",
  ...fancyDims
}: {
  key?: string;
  name?: string;
  href: string;
  filter?: string;
  opacity?: number;
  preserveAspectRatio?: string;
} & FancyDims<number>) => {
  const dims = elaborateDims(fancyDims).map(inferEmbedded);

  return new GoFishNode(
    {
      name,
      key,
      type: "image",
      args: {
        key,
        name,
        href,
        filter,
        opacity,
        preserveAspectRatio,
        dims,
      },
      resolveUnderlyingSpace: () => {
        const xPos = dims[0].center ?? dims[0].min;
        const yPos = dims[1].center ?? dims[1].min;

        let underlyingSpaceX = UNDEFINED;
        if (!isValue(xPos)) {
          underlyingSpaceX = ORDINAL([]);
        } else {
          const min = getValue(xPos) ?? 0;
          const domain = interval(min, min);
          underlyingSpaceX = POSITION(domain);
        }

        let underlyingSpaceY = UNDEFINED;
        if (!isValue(yPos)) {
          underlyingSpaceY = ORDINAL([]);
        } else {
          const min = getValue(yPos) ?? 0;
          const domain = interval(min, min);
          underlyingSpaceY = POSITION(domain);
        }

        if (isAesthetic(xPos) && isValue(dims[0].size)) {
          underlyingSpaceX = DIFFERENCE(getValue(dims[0].size)!);
        } else if (!isValue(xPos) && isValue(dims[0].size)) {
          underlyingSpaceX = SIZE(getValue(dims[0].size)!);
        }

        if (isAesthetic(yPos) && isValue(dims[1].size)) {
          underlyingSpaceY = DIFFERENCE(getValue(dims[1].size)!);
        } else if (!isValue(yPos) && isValue(dims[1].size)) {
          underlyingSpaceY = SIZE(getValue(dims[1].size)!);
        }

        return [underlyingSpaceX, underlyingSpaceY];
      },
      inferSizeDomains: () => {
        const requestedWidth = isValue(dims[0].size)
          ? getValue(dims[0].size)
          : dims[0].size;
        const requestedHeight = isValue(dims[1].size)
          ? getValue(dims[1].size)
          : dims[1].size;
        const intrinsicDimensions = resolveIntrinsicDimensions(href);
        const resolvedDimensions = resolveRenderedDimensions(
          requestedWidth,
          requestedHeight,
          intrinsicDimensions
        );

        return {
          w: Monotonic.linear(resolvedDimensions.width, 0),
          h: Monotonic.linear(resolvedDimensions.height, 0),
        };
      },
      layout: (
        shared,
        size,
        scaleFactors,
        children,
        measurement,
        posScales
      ) => {
        const requestedWidth = isValue(dims[0].size)
          ? getValue(dims[0].size)
          : dims[0].size;
        const requestedHeight = isValue(dims[1].size)
          ? getValue(dims[1].size)
          : dims[1].size;
        const intrinsicDimensions = resolveIntrinsicDimensions(href);
        const resolvedDimensions = resolveRenderedDimensions(
          requestedWidth,
          requestedHeight,
          intrinsicDimensions
        );

        const positionX =
          computeAesthetic(dims[0].center, posScales?.[0]!, undefined) ??
          computeAesthetic(dims[0].min, posScales?.[0]!, undefined);
        const positionY =
          computeAesthetic(dims[1].center, posScales?.[1]!, undefined) ??
          computeAesthetic(dims[1].min, posScales?.[1]!, undefined);

        return {
          intrinsicDims: [
            {
              min: 0,
              size: resolvedDimensions.width,
              center: resolvedDimensions.width / 2,
              max: resolvedDimensions.width,
              embedded: dims[0].embedded,
            },
            {
              min: 0,
              size: resolvedDimensions.height,
              center: resolvedDimensions.height / 2,
              max: resolvedDimensions.height,
              embedded: dims[1].embedded,
            },
          ],
          transform: {
            translate: [positionX, positionY],
          },
        };
      },
      render: ({
        intrinsicDims,
        transform,
      }: {
        intrinsicDims?: Dimensions;
        transform?: Transform;
      }) => {
        const x = (transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.min ?? 0);
        const y = (transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.min ?? 0);
        const width = intrinsicDims?.[0]?.size ?? 0;
        const height = intrinsicDims?.[1]?.size ?? 0;

        return (
          <image
            transform="scale(1, -1)"
            x={x}
            y={-y - height}
            width={Math.abs(width)}
            height={Math.abs(height)}
            href={href}
            preserveAspectRatio={preserveAspectRatio}
            filter={filter}
            opacity={opacity}
          />
        );
      },
    },
    []
  );
};

export const image = createMark(Image, {});
