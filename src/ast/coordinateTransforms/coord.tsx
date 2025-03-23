import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import { Size } from "../dims";

export type CoordinateTransform = {
  transform: (point: [number, number]) => [number, number];
  // inferDomain: ({ width, height }: { width: number; height: number }) => Interval[];
  isLinear: boolean;
};

/* TODO: implement this. I don't actually ned it until I have more complex examples tho */
const flattenLayout = (node: GoFishNode): GoFishNode[] => {
  // recursive function
  // as we go down the tree we accumulate transforms
  // we apply the cumulative transform to all nodes we hit and remove their children
  //   this includes operators and marks
  // for now we return GoFishNodes, but we could return DisplayObjects
  // DisplayObjects are probably more principled b/c of how rendering them works... idk yet
  const result: GoFishNode[] = [];
};

/* takes in a GoFishNode and converts it to some set of DisplayObjects
- layout: during layout, they flatten their child hierarchy completely, so it's easy to transform them (and
  also because coord doesn't care about graphical operators, only positions)
- rendering: then, during rendering, each mark applies its coordinate transform context. its behavior is
  influenced by its mark embedding "mode"
- DisplayObjects don't have children (inspired by tldraw a bit). also makes stuff like z-indexing
  easier later...
- TODO: we can actually mix DisplayObjects with GoFishNodes and Refs, which wil require some
  additional thought...

  For now we'll just assume that it's a GoFishNode tho... maybe it's a GoFishNode that contains DisplayObjects
  inside it?
*/
export const coord = (coordTransform: CoordinateTransform, children: GoFishNode[]): GoFishNode => {
  return new GoFishNode(
    {
      type: "coord",
      measure: (shared, size, children) => {
        const childMeasures = children.map((child) => child.measure(size));
        return (scaleFactors: Size) => {
          const childSizes = childMeasures.map((childMeasure) => childMeasure(scaleFactors));
          const maxWidth = Math.max(...childSizes.map((childSize) => childSize[0]));
          const maxHeight = Math.max(...childSizes.map((childSize) => childSize[1]));
          return [maxWidth, maxHeight];
        };
      },
      layout: (shared, size, scaleFactors, children, measurement) => {
        const childPlaceables = children.map((child) => child.layout(size, scaleFactors));

        /* TODO: maybe have to be smarter about this... */
        const maxWidth = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].max!));
        const maxHeight = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].max!));
        return {
          intrinsicDims: { w: maxWidth, h: maxHeight },
          transform: {
            translate: [0, 0],
          },
        };
      },
      render: (intrinsicDims, transform) => {
        return children.map((child) => child.render(coordTransform));
      },
    },
    children
  );
};
