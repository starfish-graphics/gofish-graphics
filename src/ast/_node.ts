import type { JSX } from "solid-js";
import {
  Dimensions,
  elaborateDims,
  elaboratePosition,
  elaborateSize,
  elaborateTransform,
  FancyDims,
  FancyPosition,
  FancySize,
  FancyTransform,
  Position,
  Size,
  Transform,
} from "./dims";
import { Domain } from "./domain";
import { getScopeContext } from "./gofish";
import { GoFishRef } from "./_ref";
import { GoFishAST } from "./_ast";
import { CoordinateTransform } from "./coordinateTransforms/coord";

/* TODO: resolveMeasures and layout feel pretty similar... */

export type Placeable = { dims: Dimensions; place: (pos: FancyPosition) => void };

export type Measure = (
  shared: Size<boolean>,
  // scaleFactors: Size<number | undefined>,
  size: Size,
  children: GoFishNode[]
) => (scaleFactors: Size) => FancySize;

export type Layout = (
  shared: Size<boolean>,
  size: Size,
  scaleFactors: Size<number | undefined>,
  children: { layout: (size: Size, scaleFactors: Size<number | undefined>) => Placeable }[],
  measurement: (scaleFactors: Size) => Size
) => { intrinsicDims: FancyDims; transform: FancyTransform; renderData?: any };

export type Render = (
  {
    intrinsicDims,
    transform,
    renderData,
    coordinateTransform,
  }: { intrinsicDims?: Dimensions; transform?: Transform; renderData?: any; coordinateTransform?: CoordinateTransform },
  children: JSX.Element[]
) => JSX.Element;

export class GoFishNode {
  public type: string;
  public name?: string;
  public parent?: GoFishNode;
  // private inferDomains: (childDomains: Size<Domain>[]) => FancySize<Domain | undefined>;
  private _measure: Measure;
  private _layout: Layout;
  private _render: Render;
  public children: GoFishAST[];
  public intrinsicDims?: Dimensions;
  public transform?: Transform;
  public shared: Size<boolean>;
  private measurement: (scaleFactors: Size) => Size;
  private renderData?: any;
  public coordinateTransform?: CoordinateTransform;
  constructor(
    {
      name,
      type,
      // inferDomains,
      measure,
      layout,
      render,
      shared = [false, false],
    }: {
      name?: string;
      type: string;
      // inferDomains: (childDomains: Size<Domain>[]) => FancySize<Domain | undefined>;
      /* TODO: I'm not sure whether scale inference and sizeThatFits should be separate or the same pass*/
      measure: Measure;
      layout: Layout;
      render: Render;
      shared?: Size<boolean>;
    },
    children: GoFishAST[]
  ) {
    // this.inferDomains = inferDomains;
    this._measure = measure;
    this._layout = layout;
    this._render = render;
    this.children = children;
    children.forEach((child) => {
      child.parent = this;
    });
    this.name = name;
    this.type = type;
    this.shared = shared;
  }

  public resolveNames(): void {
    if (this.name !== undefined) {
      getScopeContext().set(this.name, this);
    }
    this.children.forEach((child) => {
      child.resolveNames();
    });
  }

  public measure(size: Size): (scaleFactors: Size) => Size {
    const measurement = (scaleFactors: Size) =>
      elaborateSize(this._measure(this.shared, size, this.children)(scaleFactors));
    this.measurement = measurement;
    return measurement;
  }

  public layout(size: Size, scaleFactors: Size<number | undefined>): Placeable {
    const { intrinsicDims, transform, renderData } = this._layout(
      this.shared,
      size,
      scaleFactors,
      this.children,
      this.measurement
    );

    this.intrinsicDims = elaborateDims(intrinsicDims);
    this.transform = elaborateTransform(transform);
    this.renderData = renderData;
    return this;
  }

  public get dims(): Dimensions {
    // combine inrinsicDims and transform into a single object
    return [
      {
        min: (this.intrinsicDims?.[0]?.min ?? 0) + (this.transform?.translate?.[0] ?? 0),
        center: (this.intrinsicDims?.[0]?.center ?? 0) + (this.transform?.translate?.[0] ?? 0),
        max: (this.intrinsicDims?.[0]?.max ?? 0) + (this.transform?.translate?.[0] ?? 0),
        size: this.intrinsicDims?.[0]?.size ?? 0,
      },
      {
        min: (this.intrinsicDims?.[1]?.min ?? 0) + (this.transform?.translate?.[1] ?? 0),
        center: (this.intrinsicDims?.[1]?.center ?? 0) + (this.transform?.translate?.[1] ?? 0),
        max: (this.intrinsicDims?.[1]?.max ?? 0) + (this.transform?.translate?.[1] ?? 0),
        size: this.intrinsicDims?.[1]?.size ?? 0,
      },
    ];
  }

  public place(pos: FancyPosition): void {
    const elabPos = elaboratePosition(pos);
    /* for each dimension, if intrinsic dim is not defined, assign pos to that. otherwise assign it
    to corresponding translation */
    for (let i = 0; i < elabPos.length; i++) {
      if (elabPos[i] === undefined) continue;
      if (this.intrinsicDims?.[i]?.min === undefined) {
        this.intrinsicDims![i].min = elabPos[i]!;
      } /* if (this.transform?.translate?.[i] === undefined)  */ else {
        this.transform!.translate![i] = elabPos[i]! - (this.intrinsicDims![i].min ?? 0);
      } /*  else {
        console.warn("placing node with both intrinsic and transform defined");
      } */
    }
  }

  public render(coordinateTransform?: CoordinateTransform): JSX.Element {
    return this._render(
      {
        intrinsicDims: this.intrinsicDims,
        transform: this.transform,
        renderData: this.renderData,
        /* TODO: do we want to add this as an object property? */
        coordinateTransform: coordinateTransform,
      },
      this.children.map((child) => child.render(coordinateTransform))
    );
  }
}

export const findPathToRoot = (node: GoFishNode): GoFishNode[] => {
  const path: GoFishNode[] = [];
  let current = node;
  while (current) {
    path.push(current);
    current = current.parent;
  }
  return path;
};

export const findLeastCommonAncestor = (node1: GoFishNode, node2: GoFishNode): GoFishNode => {
  const path1 = findPathToRoot(node1);
  const path2 = findPathToRoot(node2);

  let i = path1.length - 1;
  let j = path2.length - 1;
  while (i >= 0 && j >= 0 && path1[i] === path2[j]) {
    i--;
    j--;
  }
  return path1[i + 1];
};

const isGoFishNode = (node: GoFishNode | GoFishAST): node is GoFishNode => {
  return "intrinsicDims" in node && "transform" in node && "dims" in node;
};

export const debugNodeTree = (node: GoFishNode | GoFishAST, indent: string = ""): void => {
  // Create a group for this node
  console.group(`${indent}Node: ${node.type}${node.name ? ` (${node.name})` : ""}`);

  // Only print GoFishNode specific properties
  if (isGoFishNode(node)) {
    // Print intrinsic dimensions
    if (node.intrinsicDims) {
      console.group(`${indent}Intrinsic Dimensions`);
      node.intrinsicDims.forEach((dim: { min?: number; center?: number; max?: number; size?: number }, i: number) => {
        console.log(
          `${i === 0 ? "Width" : "Height"}: ${JSON.stringify(
            {
              min: dim.min,
              center: dim.center,
              max: dim.max,
              size: dim.size,
            },
            null,
            2
          )}`
        );
      });
      console.groupEnd();
    }

    // Print transform
    if (node.transform) {
      console.log(
        `${indent}Transform: ${JSON.stringify(
          {
            translate: node.transform.translate,
          },
          null,
          2
        )}`
      );
    }

    // Print combined dimensions
    console.log(`${indent}Combined Dimensions: ${JSON.stringify(node.dims, null, 2)}`);
  }

  // Print children
  if ("children" in node && node.children && node.children.length > 0) {
    console.group(`${indent}Children`);
    node.children.forEach((child) => {
      debugNodeTree(child, indent + "    ");
    });
    console.groupEnd();
  }

  console.groupEnd();
};
