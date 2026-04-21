import type { JSX } from "solid-js";
import {
  Anchor,
  Dimensions,
  elaborateDims,
  elaborateDirection,
  elaboratePosition,
  elaborateSize,
  elaborateTransform,
  FancyDims,
  FancyDirection,
  FancyPosition,
  FancySize,
  FancyTransform,
  Position,
  Size,
  Transform,
} from "./dims";
import { Domain } from "./domain";
import { GoFishNode, ScaleFactorFunction } from "./_node";
import { GoFishAST } from "./_ast";
import { MaybeValue } from "./data";
import { ORDINAL, POSITION, UnderlyingSpace } from "./underlyingSpace";
import type { RenderSession } from "./_node";
import { isToken, Token } from "./createName";

/* TODO: resolveMeasures and layout feel pretty similar... */

export type Placeable = {
  dims: Dimensions;
  place: (axis: FancyDirection, value: number, anchor?: Anchor) => void;
};

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
  children: {
    layout: (size: Size, scaleFactors: Size<number | undefined>) => Placeable;
  }[],
  measurement: (scaleFactors: Size) => Size
) => { intrinsicDims: FancyDims; transform: FancyTransform };

export class GoFishRef {
  public type: string = "ref";
  public name?: string;
  public parent?: GoFishNode;

  private intrinsicDims?: Dimensions;
  private transform?: Transform;
  public shared: Size<boolean>;
  private measurement: (scaleFactors: Size) => Size;
  private selection?: string | Token | (Token | string | number)[];
  private directNode?: GoFishNode;
  private selectedNode?: GoFishNode;
  private renderSession?: RenderSession;
  public color?: MaybeValue<string>;
  constructor({
    name,
    selection,
    node,
    shared = [false, false],
  }: {
    name?: string;
    selection?: string | Token | (Token | string | number)[];
    node?: GoFishNode;
    shared?: Size<boolean>;
  }) {
    if (selection === undefined && !node) {
      throw new Error("Ref must have either selection or node");
    }
    this.name = name;
    this.shared = shared;
    this.selection = selection;
    this.directNode = node;
  }

  public resolveNames(): void {
    if (this.directNode) {
      this.selectedNode = this.directNode;
    } else if (this.selection !== undefined) {
      this.selectedNode = this.resolveSelection(this.selection);
    }
    this.color = this.selectedNode?.color;
  }

  private resolveSelection(
    selection: string | Token | (Token | string | number)[]
  ): GoFishNode {
    // String: layer-local lookup from the nearest enclosing Layer.
    if (typeof selection === "string") {
      return this.resolveLocalString(selection);
    }
    // Token: global lookup in tokenContext.
    if (isToken(selection)) {
      return this.resolveToken(selection);
    }
    // Path: first segment must be a Token (or GoFishNode). Subsequent segments
    // are tag-strings (scope-map lookup) or ints (positional).
    if (selection.length === 0) {
      throw new Error("Ref path is empty");
    }
    const head = selection[0];
    if (!isToken(head)) {
      throw new Error(
        `Ref path's first segment must be a Token (from createName), got ${typeof head}`
      );
    }
    let current: GoFishNode = this.resolveToken(head);
    for (let i = 1; i < selection.length; i++) {
      const seg = selection[i];
      const pathSoFar = selection
        .slice(0, i)
        .map((s) => (isToken(s) ? s.__tag : String(s)))
        .join(" > ");
      if (typeof seg === "number") {
        const child = current.children[seg];
        if (child === undefined) {
          throw new Error(
            `Ref path: child index ${seg} out of bounds under "${pathSoFar}" (has ${current.children.length} children)`
          );
        }
        if (!(child instanceof GoFishNode)) {
          throw new Error(
            `Ref path: child at index ${seg} under "${pathSoFar}" is not a GoFishNode`
          );
        }
        current = child;
      } else if (typeof seg === "string") {
        const map = current._scopeMap;
        if (!map) {
          throw new Error(
            `Ref path: "${pathSoFar}" is not a scope root; cannot look up tag "${seg}"`
          );
        }
        const next = map.get(seg);
        if (!next) {
          throw new Error(
            `Ref path: tag "${seg}" not found under "${pathSoFar}". Available: ${Array.from(map.keys()).join(", ")}`
          );
        }
        current = next;
      } else if (isToken(seg)) {
        // Tokens can be used as path segments for future flexibility —
        // look them up globally.
        current = this.resolveToken(seg);
      } else {
        throw new Error(`Ref path segment has unsupported type`);
      }
    }
    return current;
  }

  private resolveToken(token: Token): GoFishNode {
    const tokenContext = this.getRenderSession().tokenContext;
    const node = tokenContext.get(token);
    if (!node) {
      throw new Error(
        `Can't find token "${token.__tag}". Available token tags: ${Array.from(
          tokenContext.keys()
        )
          .map((t) => t.__tag)
          .join(", ")}`
      );
    }
    return node;
  }

  private resolveLocalString(name: string): GoFishNode {
    // Walk up .parent to find the nearest Layer (or any node with children
    // that has a child matching `name`). We check any ancestor that isn't a
    // Ref — the immediate layer is the usual scope for `.constrain({x})` and
    // for `ref("x")` local lookups.
    let ancestor: GoFishNode | undefined = this.parent;
    while (ancestor) {
      for (const child of ancestor.children) {
        if (!("_name" in child)) continue;
        const n = (child as GoFishNode)._name;
        if (n === undefined) continue;
        const tag = isToken(n) ? n.__tag : n;
        if (tag === name) {
          return child as GoFishNode;
        }
      }
      ancestor = ancestor.parent;
    }
    throw new Error(
      `Can't find local name "${name}" in any enclosing Layer's children.`
    );
  }

  public resolveKeys(): void {
    this.selectedNode?.resolveKeys();
  }

  public embed(direction: FancyDirection): void {
    this.selectedNode?.embed(direction);
  }

  public inferSizeDomains(): Size<ScaleFactorFunction | undefined> {
    return this.selectedNode?.inferSizeDomains() ?? [undefined, undefined];
  }

  /* TODO: what should the default be? */
  public resolveUnderlyingSpace(): UnderlyingSpace {
    return this.selectedNode?.resolveUnderlyingSpace() ?? ORDINAL([]);
  }

  /* TODO: I'm not really sure what this should do */
  public measure(size: Size): (scaleFactors: Size) => Size {
    const measurement = (scaleFactors: Size) =>
      // elaborateSize(this._measure(this.shared, size, this.children)(scaleFactors));
      size;
    this.measurement = measurement;
    return measurement;
  }

  public layout(size: Size, scaleFactors: Size<number | undefined>): Placeable {
    if (!this.selectedNode) {
      throw new Error("Selected node not found");
    }

    // Find the least common ancestor between this ref and the selected node
    const lca = findLeastCommonAncestor(this, this.selectedNode);

    // Compute transform from selected node up to LCA
    let upwardTransform: Transform = { translate: [0, 0] };
    let current = this.selectedNode;
    while (current && current !== lca) {
      if (current.transform) {
        upwardTransform.translate![0] += current.transform.translate?.[0] ?? 0;
        upwardTransform.translate![1] += current.transform.translate?.[1] ?? 0;
      }
      current = current.parent!;
    }

    // Compute transform from LCA down to this ref
    let downwardTransform: Transform = { translate: [0, 0] };
    current = this;
    while (current && current !== lca) {
      if (current.transform) {
        downwardTransform.translate![0] +=
          current.transform.translate?.[0] ?? 0;
        downwardTransform.translate![1] +=
          current.transform.translate?.[1] ?? 0;
      }
      current = current.parent!;
    }

    // Combine transforms
    this.transform = {
      translate: [
        upwardTransform.translate![0] - downwardTransform.translate![0],
        upwardTransform.translate![1] - downwardTransform.translate![1],
      ],
    };

    this.intrinsicDims = this.selectedNode.intrinsicDims;

    return this;
  }

  public get dims(): Dimensions {
    // Combine intrinsicDims and transform. Return undefined for min/center/max/size
    // when either the intrinsic dim or translation for that dimension is undefined,
    // so callers can distinguish "not yet placed" from "at 0".
    const dim = (i: 0 | 1) => {
      const intrinsic = this.intrinsicDims?.[i];
      const translate = this.transform?.translate?.[i];
      const hasTranslate = translate !== undefined;
      return {
        min:
          hasTranslate && intrinsic?.min !== undefined
            ? (intrinsic!.min ?? 0) + translate!
            : undefined,
        center:
          hasTranslate && intrinsic?.center !== undefined
            ? (intrinsic!.center ?? 0) + translate!
            : undefined,
        max:
          hasTranslate && intrinsic?.max !== undefined
            ? (intrinsic!.max ?? 0) + translate!
            : undefined,
        size: intrinsic?.size,
        embedded: intrinsic?.embedded,
      };
    };
    return [dim(0), dim(1)];
  }

  public place(
    axis: FancyDirection,
    value: number,
    anchor: Anchor = "min"
  ): void {
    const dir = elaborateDirection(axis);
    const intrinsic = this.intrinsicDims?.[dir];

    const anchorToDim = {
      min: intrinsic?.min,
      max: intrinsic?.max,
      center: intrinsic?.center,
      // TODO: revisit baseline case
      baseline: intrinsic?.min,
    };

    if (anchorToDim[anchor] === undefined) {
      this.intrinsicDims![dir][anchor] = value;
      return;
    }

    const anchorToPoint = {
      min: intrinsic!.min ?? 0,
      max: intrinsic!.max ?? 0,
      center: intrinsic!.center ?? 0,
      baseline: 0,
    };

    this.transform!.translate![dir] = value - anchorToPoint[anchor];
  }

  public INTERNAL_render(): JSX.Element {
    return <></>;
  }

  public setRenderSession(session: RenderSession): void {
    this.renderSession = session;
  }

  private getRenderSession(): RenderSession {
    if (this.renderSession) return this.renderSession;
    if (this.parent) return this.parent.getRenderSession();
    throw new Error("Render session not set");
  }
}

export const findPathToRoot = (node: GoFishAST): GoFishNode[] => {
  const path: GoFishNode[] = [];
  let current = node;
  while (current) {
    path.push(current);
    current = current.parent;
  }
  return path;
};

export const findLeastCommonAncestor = (
  node1: GoFishAST,
  node2: GoFishAST
): GoFishNode => {
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
