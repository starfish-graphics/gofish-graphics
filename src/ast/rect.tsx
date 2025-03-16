import { GoFishNode } from "./_node";
import { Value } from "./data";
import { elaborateDims, FancyDims } from "./dims";

export const rect = ({ fill = "black", ...fancyDims }: { fill?: string } & FancyDims</* Value<number> */ number>) => {
  const dims = elaborateDims(fancyDims);
  return new GoFishNode(
    {
      inferDomain: () => {},
      sizeThatFits: () => {},
      layout: () => {},
      render: () => {
        return <rect x={dims[0].min!} y={dims[1].min!} width={dims[0].size!} height={dims[1].size!} fill={fill} />;
      },
    },
    []
  );
};
