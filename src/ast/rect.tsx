import { GoFishNode } from "./_node";
import { getDataType, getValue, isValue, MaybeValue, Value } from "./data";
import { Dimensions, elaborateDims, FancyDims, FancySize, Size, Transform } from "./dims";
import { aesthetic, continuous } from "./domain";

export const rect = ({
  name,
  fill = "black",
  ...fancyDims
}: { name?: string; fill?: string } & FancyDims<MaybeValue<number>>) => {
  const dims = elaborateDims(fancyDims);
  return new GoFishNode(
    {
      name,
      type: "rect",
      // inferDomains: () => {
      //   return [
      //     isValue(dims[0].size)
      //       ? continuous({
      //           value: [0, getValue(dims[0].size)],
      //           dataType: getDataType(dims[0].size),
      //         })
      //       : dims[0].size
      //       ? aesthetic(dims[0].size)
      //       : undefined,
      //     isValue(dims[1].size)
      //       ? continuous({
      //           value: [0, getValue(dims[1].size)],
      //           dataType: getDataType(dims[1].size),
      //         })
      //       : dims[1].size
      //       ? aesthetic(dims[1].size)
      //       : undefined,
      //   ];
      // },
      measure: (shared, size, children) => {
        return (scaleFactors: Size): FancySize => {
          return {
            w: isValue(dims[0].size) ? getValue(dims[0].size!) * scaleFactors[0] : dims[0].size ?? size[0],
            h: isValue(dims[1].size) ? getValue(dims[1].size!) * scaleFactors[1] : dims[1].size ?? size[1],
          };
        };
      },
      layout: (shared, size, scaleFactors, children, measurement) => {
        const w = isValue(dims[0].size) ? getValue(dims[0].size!) * scaleFactors[0]! : dims[0].size ?? size[0];
        const h = isValue(dims[1].size) ? getValue(dims[1].size!) * scaleFactors[1]! : dims[1].size ?? size[1];

        return {
          intrinsicDims: [
            {
              min: 0,
              size: w,
              center: w / 2,
              max: w,
            },
            {
              min: 0,
              size: h,
              center: h / 2,
              max: h,
            },
          ],
          transform: {
            /* TODO: handle the case where they are scaled... */
            translate: [getValue(dims[0].min!), getValue(dims[1].min!)],
          },
        };
      },
      render: ({ intrinsicDims, transform }: { intrinsicDims?: Dimensions; transform?: Transform }) => {
        return (
          <rect
            filter="url(#crumpled-paper)"
            x={(transform?.translate?.[0] ?? 0) + (intrinsicDims?.[0]?.min ?? 0)}
            y={(transform?.translate?.[1] ?? 0) + (intrinsicDims?.[1]?.min ?? 0)}
            width={intrinsicDims?.[0]?.size ?? 0}
            height={intrinsicDims?.[1]?.size ?? 0}
            fill={fill}
            shape-rendering="crispEdges"
          />
        );
      },
    },
    []
  );
};
