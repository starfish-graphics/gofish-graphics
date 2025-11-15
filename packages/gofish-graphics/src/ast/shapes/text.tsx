import { GoFishNode } from "../_node";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { linear } from "../coordinateTransforms/linear";
import { MaybeValue, getValue, isValue } from "../data";
import { Dimensions, Transform } from "../dims";
import * as Monotonic from "../../util/monotonic";

// Approximate text metrics based on font properties
const estimateTextDimensions = (
  text: string,
  fontSize: number,
  fontFamily: string
): { width: number; height: number } => {
  // Rough character width estimation - could be improved with actual measurement
  const avgCharWidth = fontSize * 0.6; // Most fonts are ~0.6x font size in width
  const width = text.length * avgCharWidth;
  const height = fontSize * 1.2; // Include line height
  
  return { width, height };
};

export const text = ({
  key,
  name,
  text: textContent,
  x = 0,
  y = 0,
  fill = "black",
  fontSize = 12,
  fontFamily = "system-ui, sans-serif",
  textAnchor = "middle",
  dominantBaseline = "central",
}: {
  key?: string;
  name?: string;
  text: MaybeValue<string>;
  x?: MaybeValue<number>;
  y?: MaybeValue<number>;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?: "auto" | "central" | "hanging" | "mathematical";
}) => {
  return new GoFishNode(
    {
      name,
      key,
      type: "text",
      inferPosDomains: () => [undefined, undefined],
      inferSizeDomains: () => {
        const finalText = isValue(textContent) ? getValue(textContent) : textContent;
        const { width, height } = estimateTextDimensions(finalText, fontSize, fontFamily);
        
        return {
          w: Monotonic.linear(width, 0),
          h: Monotonic.linear(height, 0),
        };
      },
      layout: (shared, size, scaleFactors, children, measurement, posScales) => {
        const finalX = isValue(x) ? getValue(x) : 0;
        const finalY = isValue(y) ? getValue(y) : 0;
        const finalText = isValue(textContent) ? getValue(textContent) : textContent;
        const { width, height } = estimateTextDimensions(finalText, fontSize, fontFamily);

        return {
          intrinsicDims: [
            { 
              min: finalX - width/2, 
              size: width, 
              center: finalX, 
              max: finalX + width/2 
            },
            { 
              min: finalY - height/2, 
              size: height, 
              center: finalY, 
              max: finalY + height/2 
            },
          ],
          transform: { translate: [0, 0] },
        };
      },
      render: ({
        intrinsicDims,
        transform,
        coordinateTransform,
      }: {
        intrinsicDims?: Dimensions;
        transform?: Transform;
        coordinateTransform?: CoordinateTransform;
      }) => {
        const space = coordinateTransform ?? linear();
        
        const finalText = isValue(textContent) ? getValue(textContent) : textContent;
        const finalX = intrinsicDims?.[0]?.center ?? 0;
        const finalY = intrinsicDims?.[1]?.center ?? 0;

        const [transformedX, transformedY] = space.transform([finalX, finalY]);

        return (
          <text
            x={transformedX}
            y={transformedY}
            fill={fill}
            font-size={fontSize}
            font-family={fontFamily}
            text-anchor={textAnchor}
            dominant-baseline={dominantBaseline}
          >
            {finalText}
          </text>
        );
      },
    },
    []
  );
};