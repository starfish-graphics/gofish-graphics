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
import { getScopeContext, getKeyContext } from "./gofish";
import { GoFishNode } from "./_node";
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
      // If we have a stored key for lazy resolution, try to look up from keyContext first
      const refKey = (this as any)._refKey;
      if (refKey !== undefined) {
        try {
          const keyContext = getKeyContext();
          const lookedUpNode = keyContext[refKey];
          if (lookedUpNode) {
            console.log(
              "[DEBUG GoFishRef.resolveNames] Resolved node from keyContext",
              {
                key: refKey,
                originalUid: this.directNode.uid,
                lookedUpUid: lookedUpNode.uid,
                hasIntrinsicDims: !!lookedUpNode.intrinsicDims,
              }
            );
            this.selectedNode = lookedUpNode;
            this.color = this.selectedNode?.color;
            return;
          }
        } catch (error) {
          // keyContext not available yet, fall through to use directNode
          console.log(
            "[DEBUG GoFishRef.resolveNames] keyContext lookup failed, using directNode",
            {
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
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
    console.log("[DEBUG GoFishRef.embed]", {
      refName: this.name,
      hasSelectedNode: !!this.selectedNode,
      selectedNodeType: this.selectedNode?.type,
      selectedNodeKey: this.selectedNode?.key,
      selectedNodeName: this.selectedNode?.name,
      selectedNodeUid: this.selectedNode?.uid,
      selectedNodeHasIntrinsicDims: !!this.selectedNode?.intrinsicDims,
      selectedNodeIntrinsicDimsLength: this.selectedNode?.intrinsicDims?.length,
      selectedNodeIntrinsicDims: this.selectedNode?.intrinsicDims,
      direction,
      stackTrace: new Error().stack?.split("\n").slice(0, 5).join("\n"),
    });

    if (!this.selectedNode) {
      console.error("[ERROR GoFishRef.embed] selectedNode is undefined!", {
        refName: this.name,
        selection: this.selection,
      });
      throw new Error(
        `Cannot embed: selectedNode is undefined for ref ${this.name || "unnamed"}`
      );
    }

    // If the selected node doesn't have intrinsicDims, try to look it up from keyContext
    // This handles the case where refs point to pre-layout nodes but we need laid-out nodes
    if (
      !this.selectedNode.intrinsicDims &&
      this.selectedNode.key !== undefined
    ) {
      try {
        const keyContext = getKeyContext();
        const lookedUpNode = keyContext[this.selectedNode.key];
        if (lookedUpNode && lookedUpNode.intrinsicDims) {
          console.log("[DEBUG GoFishRef.embed] Resolved node from keyContext", {
            key: this.selectedNode.key,
            originalUid: this.selectedNode.uid,
            lookedUpUid: lookedUpNode.uid,
            hasIntrinsicDims: !!lookedUpNode.intrinsicDims,
          });
          // Update selectedNode to point to the laid-out node
          this.selectedNode = lookedUpNode;
        }
      } catch (error) {
        // keyContext not available, use original node
        console.log(
          "[DEBUG GoFishRef.embed] keyContext lookup failed, using original node",
          {
            error: error instanceof Error ? error.message : String(error),
          }
        );
      }
    }

    this.selectedNode.embed(direction);
  }

  public inferPosDomains(): Size<Domain | undefined> {
    return this.selectedNode?.inferPosDomains() ?? [undefined, undefined];
  }

  /* TODO: what should the default be? */
  public resolveUnderlyingSpace(): UnderlyingSpace {
    return this.selectedNode?.resolveUnderlyingSpace() ?? ORDINAL;
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
    // combine inrinsicDims and transform into a single object
    return [
      {
        min:
          (this.intrinsicDims?.[0]?.min ?? 0) +
          (this.transform?.translate?.[0] ?? 0),
        center:
          (this.intrinsicDims?.[0]?.center ?? 0) +
          (this.transform?.translate?.[0] ?? 0),
        max:
          (this.intrinsicDims?.[0]?.max ?? 0) +
          (this.transform?.translate?.[0] ?? 0),
        size: this.intrinsicDims?.[0]?.size ?? 0,
      },
      {
        min:
          (this.intrinsicDims?.[1]?.min ?? 0) +
          (this.transform?.translate?.[1] ?? 0),
        center:
          (this.intrinsicDims?.[1]?.center ?? 0) +
          (this.transform?.translate?.[1] ?? 0),
        max:
          (this.intrinsicDims?.[1]?.max ?? 0) +
          (this.transform?.translate?.[1] ?? 0),
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
        this.transform!.translate![i] =
          elabPos[i]! - (this.intrinsicDims![i].min ?? 0);
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
