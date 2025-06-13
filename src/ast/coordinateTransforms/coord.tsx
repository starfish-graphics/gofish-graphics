import { Show } from "solid-js";
import { path, pathToSVGPath, transformPath } from "../../path";
import { GoFishAST } from "../_ast";
import { GoFishNode } from "../_node";
import { elaborateDims, FancyDims, Interval, Size } from "../dims";
import { black } from "../../color";
import { canUnifyDomains, Domain, unifyContinuousDomains } from "../domain";

export type CoordinateTransform = {
  type: string;
  transform: (point: [number, number]) => [number, number];
  // inferDomain: ({ width, height }: { width: number; height: number }) => Interval[];
  domain: [Interval, Interval];
};

/* TODO: implement this. I don't actually need it until I have more complex examples tho */
const flattenLayout = (
  node: GoFishAST,
  transform: [number, number] = [0, 0],
  scale: [number, number] = [1, 1]
): GoFishAST[] => {
  // recursive function
  // as we go down the tree we accumulate transforms
  // we apply the cumulative transform to all nodes we hit and remove their children
  //   this includes operators and marks
  // for now we return GoFishNodes, but we could return DisplayObjects
  // DisplayObjects are probably more principled b/c of how rendering them works... idk yet

  /* TODO: `connect` is a hack to get the operator to render in coordinate spaces
       A more principled way to do this would be to have "connect" produce a child path mark.  
  */
  if (
    !("children" in node) ||
    !node.children ||
    node.children.length === 0 ||
    node.type === "connect" ||
    node.type === "box"
  ) {
    node.transform = {
      translate: [
        (node.transform?.translate?.[0] ?? 0) + transform[0]!,
        (node.transform?.translate?.[1] ?? 0) + transform[1]!,
      ],
      scale: [(node.transform?.scale?.[0] ?? 1) * (scale[0] ?? 1), (node.transform?.scale?.[1] ?? 1) * (scale[1] ?? 1)],
    };
    return [node];
  }

  const newTransform: [number, number] = [
    transform[0]! + (node.transform?.translate?.[0] ?? 0),
    transform[1]! + (node.transform?.translate?.[1] ?? 0),
  ];

  const newScale: [number, number] = [
    (node.transform?.scale?.[0] ?? 1) * (scale[0] ?? 1),
    (node.transform?.scale?.[1] ?? 1) * (scale[1] ?? 1),
  ];

  return node.children.flatMap((child) => flattenLayout(child, newTransform, newScale));
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
export const coord = (
  {
    name,
    transform: coordTransform,
    grid = false,
    ...fancyDims
  }: {
    name?: string;
    transform: CoordinateTransform;
    grid?: boolean;
  } & FancyDims,
  children: GoFishNode[]
) => {
  const dims = elaborateDims(fancyDims);

  return new GoFishNode(
    {
      type: "coord",
      name,
      inferPosDomains: (childPosDomains: Size<Domain>[]) => {
        // unify continuous domains of children for each direction
        return [
          canUnifyDomains(childPosDomains.map((childPosDomain) => childPosDomain[0]))
            ? unifyContinuousDomains(childPosDomains.map((childPosDomain) => childPosDomain[0]))
            : undefined,
          canUnifyDomains(childPosDomains.map((childPosDomain) => childPosDomain[1]))
            ? unifyContinuousDomains(childPosDomains.map((childPosDomain) => childPosDomain[1]))
            : undefined,
        ];
      },
      inferSizeDomains: (shared, size, children) => {
        // TODO: only works for polar2 right now
        size = [2 * Math.PI, Math.min(size[0], size[1]) / 2 - 30];
        const childMeasures = children.map((child) => child.inferSizeDomains(size));
        return (scaleFactors: Size) => {
          const childSizes = childMeasures.map((childMeasure) => childMeasure(scaleFactors));
          const maxWidth = Math.max(...childSizes.map((childSize) => childSize[0]));
          const maxHeight = Math.max(...childSizes.map((childSize) => childSize[1]));
          return [maxWidth, maxHeight];
        };
      },
      layout: (shared, size, scaleFactors, children, measurement) => {
        /* TODO: need correct scale factors */
        // TODO: only works for polar2 right now
        size = [2 * Math.PI, Math.min(size[0], size[1]) / 2 - 30];
        const childPlaceables = children.map((child) => child.layout(size, [1, 1]));

        /* TODO: maybe have to be smarter about this... */
        const minX = Math.min(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].min!));
        const maxX = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[0].max!));
        const minY = Math.min(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].min!));
        const maxY = Math.max(...childPlaceables.map((childPlaceable) => childPlaceable.dims[1].max!));

        return {
          intrinsicDims: {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
          },
          transform: {
            translate: [
              dims[0].min !== undefined ? dims[0].min - minX : undefined,
              dims[1].min !== undefined ? dims[1].min - minY : undefined,
            ],
          },
        };
      },
      render: ({ transform }) => {
        const gridLines = () => {
          /* take an evenly space net of lines covering the space, map them through the space, and
          render the paths */
          // const domain = space.inferDomain({ width, height });
          const lines = [];
          const ticks = [];

          const domain = coordTransform.domain;

          for (let i = domain[0].min!; i <= domain[0].max!; i += domain[0].size! / 10) {
            const line = transformPath(
              path(
                [
                  [i, domain[1].min!],
                  [i, domain[1].max!],
                ],
                { subdivision: 100 }
              ),
              coordTransform
            );
            lines.push(<path d={pathToSVGPath(line)} stroke={black} fill="none" />);
            const [x, y] = coordTransform.transform([i, domain[1].max!]);
            ticks.push(
              <text x={x} y={y} /* dy="-1em" */ font-size="8pt" fill={black}>
                {i.toFixed(0)}
              </text>
            );
          }
          for (let i = domain[1].min!; i <= domain[1].max!; i += domain[1].size! / 10) {
            const line = transformPath(
              path(
                [
                  [domain[0].min!, i],
                  [domain[0].max!, i],
                ],
                { subdivision: 100 }
              ),
              coordTransform
            );
            lines.push(<path d={pathToSVGPath(line)} stroke={black} fill="none" />);
            const [x, y] = coordTransform.transform([domain[0].max! + domain[0].size! / 20, i]);
            ticks.push(
              <text x={x} y={y} /* dy="-1em" */ font-size="8pt" fill={black}>
                {i.toFixed(0)}
              </text>
            );
          }
          return (
            <g>
              {lines}
              {ticks}
            </g>
          );
        };

        const flattenedChildren = children.flatMap((child) => flattenLayout(child));

        return (
          <g transform={`translate(${transform?.translate?.[0] ?? 0}, ${transform?.translate?.[1] ?? 0})`}>
            {flattenedChildren.map((child) => child.INTERNAL_render(coordTransform))}
            <Show when={grid}>{gridLines()}</Show>
          </g>
        );
      },
    },
    children
  );
};
