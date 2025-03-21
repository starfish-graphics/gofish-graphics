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
import { GoFishNode } from "./_node";

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
) => { intrinsicDims: FancyDims; transform: FancyTransform };

export class GoFishRef {
  public type: string = "ref";
  public name?: string;
  public parent?: GoFishNode;
  // private inferDomains: (childDomains: Size<Domain>[]) => FancySize<Domain | undefined>;
  private _measure: Measure;
  private _layout: Layout;
  private _render: (
    { intrinsicDims, transform }: { intrinsicDims?: Dimensions; transform?: Transform },
    children: JSX.Element[]
  ) => JSX.Element;
  private intrinsicDims?: Dimensions;
  private transform?: Transform;
  public shared: Size<boolean>;
  private measurement: (scaleFactors: Size) => Size;
  private selection: string;
  private selectedNode?: GoFishNode;
  private children: GoFishNode[] = [];
  constructor(
    {
      name,
      selection,
      // inferDomains,
      measure,
      layout,
      render,
      shared = [false, false],
    }: {
      name?: string;
      selection: string;
      // inferDomains: (childDomains: Size<Domain>[]) => FancySize<Domain | undefined>;
      /* TODO: I'm not sure whether scale inference and sizeThatFits should be separate or the same pass*/
      measure: Measure;
      layout: Layout;
      render: (
        { intrinsicDims, transform }: { intrinsicDims?: Dimensions; transform?: Transform },
        children: JSX.Element[]
      ) => JSX.Element;
      shared?: Size<boolean>;
    },
    children: GoFishNode[]
  ) {
    // this.inferDomains = inferDomains;
    this._measure = measure;
    this._layout = layout;
    this._render = render;
    this.name = name;
    this.shared = shared;
    this.selection = selection;
  }

  public resolveNames(): void {
    this.selectedNode = getScopeContext().get(this.selection);
    console.log("selectedNode", this.selectedNode);
  }

  public measure(size: Size): (scaleFactors: Size) => Size {
    const measurement = (scaleFactors: Size) =>
      elaborateSize(this._measure(this.shared, size, this.children)(scaleFactors));
    this.measurement = measurement;
    return measurement;
  }

  public layout(size: Size, scaleFactors: Size<number | undefined>): Placeable {
    const { intrinsicDims, transform } = this._layout(this.shared, size, scaleFactors, this.children, this.measurement);

    this.intrinsicDims = elaborateDims(intrinsicDims);
    this.transform = elaborateTransform(transform);

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
      } else {
        this.transform!.translate![i] = elabPos[i]! - (this.intrinsicDims![i].min ?? 0);
      }
    }
  }

  public render(): JSX.Element {
    return this._render(
      { intrinsicDims: this.intrinsicDims, transform: this.transform },
      this.children.map((child) => child.render())
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
