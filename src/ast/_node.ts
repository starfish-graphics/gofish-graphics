import type { JSX } from "solid-js";
import { Dimensions } from "./dims";

export type Transform = { translate?: [number, number] };

export class GoFishNode {
  private _name: string;
  private inferDomain() {}
  private sizeThatFits() {}
  private _layout: (children: { layout: () => Dimensions }[]) => { intrinsicDims: Dimensions; transform: Transform };
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
      layout: (children: { layout: () => Dimensions }[]) => { intrinsicDims: Dimensions; transform: Transform };
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

  public layout(): Dimensions {
    const { intrinsicDims, transform } = this._layout(this.children);

    this.intrinsicDims = intrinsicDims;
    this.transform = transform;

    // combine inrinsicDims and transform into a single object
    return [
      {
        min: (intrinsicDims?.[0]?.min ?? 0) + (transform?.translate?.[0] ?? 0),
        center: (intrinsicDims?.[0]?.center ?? 0) + (transform?.translate?.[0] ?? 0),
        max: (intrinsicDims?.[0]?.max ?? 0) + (transform?.translate?.[0] ?? 0),
        size: intrinsicDims?.[0]?.size ?? 0,
      },
      {
        min: (intrinsicDims?.[1]?.min ?? 0) + (transform?.translate?.[1] ?? 0),
        center: (intrinsicDims?.[1]?.center ?? 0) + (transform?.translate?.[1] ?? 0),
        max: (intrinsicDims?.[1]?.max ?? 0) + (transform?.translate?.[1] ?? 0),
        size: intrinsicDims?.[1]?.size ?? 0,
      },
    ];
  }

  public render(): JSX.Element {
    return this._render(
      { intrinsicDims: this.intrinsicDims, transform: this.transform },
      this.children.map((child) => child.render())
    );
  }
}
