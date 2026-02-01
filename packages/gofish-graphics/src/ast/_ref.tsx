import type { JSX } from "solid-js";
import {
  Dimensions,
  elaborateDims,
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
import { getScopeContext } from "./gofish";
import { GoFishNode, ScaleFactorFunction } from "./_node";
import { GoFishAST } from "./_ast";
import { MaybeValue } from "./data";
import { ORDINAL, POSITION, UnderlyingSpace } from "./underlyingSpace";

/* TODO: resolveMeasures and layout feel pretty similar... */

export type Placeable = {
  dims: Dimensions;
  place: (pos: FancyPosition) => void;
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
  private selection?: string;
  private directNode?: GoFishNode;
  private selectedNode?: GoFishNode;
  public color?: MaybeValue<string>;
  constructor({
    name,
    selection,
    node,
    shared = [false, false],
  }: {
    name?: string;
    selection?: string;
    node?: GoFishNode;
    shared?: Size<boolean>;
  }) {
    if (!selection && !node) {
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
    } else if (this.selection) {
      this.selectedNode = getScopeContext().get(this.selection);
      if (this.selectedNode === undefined) {
        throw new Error(
          `Can't find "${this.selection}". Available nodes: ${Array.from(getScopeContext().keys()).join(", ")}`
        );
      }
    }
    this.color = this.selectedNode?.color;
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

  public place(pos: FancyPosition): void {
    const elabPos = elaboratePosition(pos);
    /* For each dimension, if intrinsic dim is not defined, assign pos to that.
     * Otherwise, compute translation to position the implicit anchor point.
     *
     * The anchor point is always the local origin (0). Shapes set up their
     * intrinsic dimensions so that one edge is at 0:
     * - For positive sizes: min = 0 (anchor at bottom)
     * - For negative sizes: max = 0 (anchor at top)
     */
    for (let i = 0; i < elabPos.length; i++) {
      if (elabPos[i] === undefined) continue;
      if (this.intrinsicDims?.[i]?.min === undefined) {
        this.intrinsicDims![i].min = elabPos[i]!;
      } else {
        this.transform!.translate![i] = elabPos[i]!;
      }
    }
  }

  public INTERNAL_render(): JSX.Element {
    return <></>;
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
