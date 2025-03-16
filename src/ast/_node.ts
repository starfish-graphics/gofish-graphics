import type { JSX } from "solid-js";

export class GoFishNode {
  private inferDomain() {}
  private sizeThatFits() {}
  private layout() {}
  private _render: () => JSX.Element;
  private children: GoFishNode[];

  constructor(
    {
      inferDomain,
      sizeThatFits,
      layout,
      render,
    }: {
      inferDomain: () => void;
      sizeThatFits: () => void;
      layout: () => void;
      render: () => JSX.Element;
    },
    children: GoFishNode[]
  ) {
    this.inferDomain = inferDomain;
    this.sizeThatFits = sizeThatFits;
    this.layout = layout;
    this._render = render;
    this.children = children;
  }

  public render() {
    return this._render();
  }
}
