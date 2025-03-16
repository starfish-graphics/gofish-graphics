import type { JSX } from "solid-js";
import { Dimensions, elaboratePosition, FancyPosition } from "./dims";

export type Transform = { translate?: [number, number] };
export type Placeable = { dims: Dimensions; place: (pos: FancyPosition) => void };

export class GoFishNode {
  private _name: string;
  private inferDomain() {}
  private sizeThatFits() {}
  private _layout: (children: { layout: () => Placeable }[]) => {
    intrinsicDims: Dimensions;
    transform: Transform;
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
      layout: (children: { layout: () => Placeable }[]) => {
        intrinsicDims: Dimensions;
        transform: Transform;
      };
      render: (
        { intrinsicDims, transform }: { intrinsicDims?: Dimensions; transform?: { translate?: [number, number] } },
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

  public layout(): Placeable {
    const { intrinsicDims, transform } = this._layout(this.children);

    this.intrinsicDims = intrinsicDims;
    this.transform = transform;

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
    pos = elaboratePosition(pos);
    /* for each dimension, if intrinsic dim is not defined, assign pos to that. otherwise assign it
    to corresponding translation */
    for (let i = 0; i < pos.length; i++) {
      if (this.intrinsicDims?.[i]?.min === undefined) {
        this.intrinsicDims![i].min = pos[i]!;
      } else {
        this.transform!.translate![i] = pos[i]!;
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
