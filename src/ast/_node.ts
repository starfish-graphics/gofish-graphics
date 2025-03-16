import type { JSX } from "solid-js";
import {
  Dimensions,
  elaborateDims,
  elaboratePosition,
  elaborateTransform,
  FancyDims,
  FancyPosition,
  FancySize,
  FancyTransform,
  Position,
  Transform,
} from "./dims";

export type Placeable = { dims: Dimensions; place: (pos: FancyPosition) => void };

export class GoFishNode {
  private _name: string;
  private inferDomain() {}
  private sizeThatFits() {}
  private _layout: (
    size: FancySize,
    children: { layout: (size: FancySize) => Placeable }[]
  ) => {
    intrinsicDims: FancyDims;
    transform: FancyTransform;
  };
  private _render: (
    { intrinsicDims, transform }: { intrinsicDims?: Dimensions; transform?: Transform },
    children: JSX.Element[]
  ) => JSX.Element;
  private children: GoFishNode[];
  private intrinsicDims?: Dimensions;
  private transform?: Transform;

  constructor(
    {
      name,
      inferDomain,
      sizeThatFits,
      layout,
      render,
    }: {
      name: string;
      inferDomain: () => void;
      sizeThatFits: () => void;
      layout: (
        size: FancySize,
        children: { layout: (size: FancySize) => Placeable }[]
      ) => {
        intrinsicDims: FancyDims;
        transform: FancyTransform;
      };
      render: (
        { intrinsicDims, transform }: { intrinsicDims?: Dimensions; transform?: Transform },
        children: JSX.Element[]
      ) => JSX.Element;
    },
    children: GoFishNode[]
  ) {
    this.inferDomain = inferDomain;
    this.sizeThatFits = sizeThatFits;
    this._layout = layout;
    this._render = render;
    this.children = children;
    this._name = name;
  }

  public layout(size: FancySize): Placeable {
    const { intrinsicDims, transform } = this._layout(size, this.children);

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
