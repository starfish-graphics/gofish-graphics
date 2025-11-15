import { GoFishNode } from "../_node";
import { CoordinateTransform } from "../coordinateTransforms/coord";
import { linear } from "../coordinateTransforms/linear";
import { MaybeValue, getValue, isValue } from "../data";
import { Dimensions, Transform } from "../dims";
import { 
  LabelConfig, 
  LabelPosition, 
  inferLabelPosition, 
  calculateLabelOffset, 
  shouldShowLabel,
  ShapeInfo,
  LayoutContext 
} from "../labels/labelPlacement";
import * as Monotonic from "../../util/monotonic";

// Approximate text metrics based on font properties
const estimateTextDimensions = (
  text: string,
  fontSize: number,
  fontFamily: string
): { width: number; height: number } => {
  const avgCharWidth = fontSize * 0.6;
  const width = text.length * avgCharWidth;
  const height = fontSize * 1.2;
  
  return { width, height };
};

export const label = ({
  key,
  name,
  text: textContent,
  x = 0,
  y = 0,
  fill = "black",
  fontSize = 12,
  fontFamily = "system-ui, sans-serif",
  position = "auto",
  offset = 5,
  minSpace = 20,
  preferInside = true,
  targetShape,
  layoutContext,
}: {
  key?: string;
  name?: string;
  text: MaybeValue<string>;
  x?: MaybeValue<number>;
  y?: MaybeValue<number>;
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  position?: LabelPosition;
  offset?: number;
  minSpace?: number;
  preferInside?: boolean;
  targetShape?: ShapeInfo;
  layoutContext?: LayoutContext;
}) => {
  const labelConfig: LabelConfig = {
    position,
    offset,
    minSpace,
    preferInside,
  };

  return new GoFishNode(
    {
      name,
      key,
      type: "label",
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
        let finalX = isValue(x) ? getValue(x) : 0;
        let finalY = isValue(y) ? getValue(y) : 0;
        const finalText = isValue(textContent) ? getValue(textContent) : textContent;
        const { width, height } = estimateTextDimensions(finalText, fontSize, fontFamily);
        
        // Apply smart positioning if we have shape and context info
        let computedPosition = position;
        let textAnchor: "start" | "middle" | "end" = "middle";
        
        if (targetShape && layoutContext) {
          computedPosition = inferLabelPosition(targetShape, layoutContext, labelConfig);
          const positionOffset = calculateLabelOffset(computedPosition, targetShape.dimensions, labelConfig);
          finalX += positionOffset.x;
          finalY += positionOffset.y;
          
          // Adjust text anchor based on position
          if (computedPosition === "left" || computedPosition === "outside-start") {
            textAnchor = "end";
          } else if (computedPosition === "right" || computedPosition === "outside-end") {
            textAnchor = "start";
          } else {
            textAnchor = "middle";
          }
        }

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
          metadata: { computedPosition, textAnchor },
        };
      },
      render: ({
        intrinsicDims,
        transform,
        coordinateTransform,
        metadata,
      }: {
        intrinsicDims?: Dimensions;
        transform?: Transform;
        coordinateTransform?: CoordinateTransform;
        metadata?: any;
      }) => {
        const space = coordinateTransform ?? linear();
        
        const finalText = isValue(textContent) ? getValue(textContent) : textContent;
        const finalX = intrinsicDims?.[0]?.center ?? 0;
        const finalY = intrinsicDims?.[1]?.center ?? 0;
        const computedPosition = metadata?.computedPosition ?? position;
        const textAnchor = metadata?.textAnchor ?? "middle";
        
        // Check if label should be shown based on heuristics
        if (targetShape && layoutContext) {
          if (!shouldShowLabel(targetShape, finalText, computedPosition, labelConfig)) {
            return null;
          }
        }

        // Transform coordinates
        const [transformedX, transformedY] = space.transform([finalX, finalY]);

        return (
          <text
            x={transformedX}
            y={transformedY}
            fill={fill}
            font-size={fontSize}
            font-family={fontFamily}
            text-anchor={textAnchor}
            dominant-baseline="central"
          >
            {finalText}
          </text>
        );
      },
    },
    []
  );
};