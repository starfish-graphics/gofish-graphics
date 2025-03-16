import { GoFishNode } from "./_node";
import { Value } from "./data";
import { Dimensions, elaborateDims, FancyDims } from "./dims";

export const rect = ({ fill = "black", ...fancyDims }: { fill?: string } & FancyDims</* Value<number> */ number>) => {
  const dims = elaborateDims(fancyDims);
  return new GoFishNode(
    {
      name: "rect",
      inferDomain: () => {},
      sizeThatFits: () => {},
      layout: () => {
        return {
          intrinsicDims: [
            {
              min: 0,
              size: dims[0].size,
              center: dims[0].size! / 2,
              max: dims[0].size,
            },
            {
              min: 0,
              size: dims[1].size,
              center: dims[1].size! / 2,
              max: dims[1].size,
            },
          ],
          transform: {
            translate: [dims[0].min!, dims[1].min!],
          },
        };
      },
      render: ({
        intrinsicDims,
        transform,
      }: {
        intrinsicDims?: Dimensions;
        transform?: { translate?: [number, number] };
      }) => {
        return (
          <rect
            x={(transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.min ?? 0)}
            y={(transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.min ?? 0)}
            width={intrinsicDims?.[0]?.size ?? 0}
            height={intrinsicDims?.[1]?.size ?? 0}
            fill={fill}
          />
        );
      },
    },
    []
  );
};
