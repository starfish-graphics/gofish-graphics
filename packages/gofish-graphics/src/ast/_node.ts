import type { JSX } from "solid-js";
import {
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
import { ContinuousDomain } from "./domain";
import {
  getKeyContext,
  getScaleContext,
  getScopeContext,
  gofish,
} from "./gofish";
import { GoFishRef } from "./_ref";
import { GoFishAST } from "./_ast";
import { CoordinateTransform } from "./coordinateTransforms/coord";
import { getValue, isValue, MaybeValue } from "./data";
import { color6 } from "../color";
import * as Monotonic from "../util/monotonic";
import { findTargetMonotonic } from "../util";
import {
  isDIFFERENCE,
  isORDINAL,
  isPOSITION,
  isUNDEFINED,
  UnderlyingSpace,
} from "./underlyingSpace";
import { toJSON } from "../util/interval";

export type ScaleFactorFunction = Monotonic.Monotonic;

export const findScaleFactor = (
  sizeDomain: ScaleFactorFunction,
  targetValue: number,
  options: {
    tolerance?: number;
    maxIterations?: number;
    lowerBound?: number;
    upperBoundGuess?: number;
  }
): number => {
  return sizeDomain.inverse(targetValue, options) ?? 0;
};

export type Placeable = {
  dims: Dimensions;
  place: (pos: FancyPosition) => void;
};

export type InferSizeDomains = (
  shared: Size<boolean>,
  // scaleFactors: Size<number | undefined>,
  // size: Size,
  children: GoFishNode[]
) => FancySize<ScaleFactorFunction>;

export type Layout = (
  shared: Size<boolean>,
  size: Size,
  scaleFactors: Size<number | undefined>,
  children: {
    layout: (
      size: Size,
      scaleFactors: Size<number | undefined>,
      posScales: Size<((pos: number) => number) | undefined>
    ) => Placeable;
  }[],
  sizeDomains: Size<ScaleFactorFunction>,
  posScales: Size<((pos: number) => number) | undefined>
) => { intrinsicDims: FancyDims; transform: FancyTransform; renderData?: any };

export type Render = (
  {
    intrinsicDims,
    transform,
    renderData,
    coordinateTransform,
  }: {
    intrinsicDims?: Dimensions;
    transform?: Transform;
    renderData?: any;
    coordinateTransform?: CoordinateTransform;
  },
  children: JSX.Element[]
) => JSX.Element;

export type ResolveUnderlyingSpace = (
  childSpaces: Size<UnderlyingSpace>[]
) => FancySize<UnderlyingSpace>;

export class GoFishNode {
  public readonly uid: string;
  private static uidCounter = 0;
  public type: string;
  public args?: any;
  public key?: string;
  public _name?: string;
  public parent?: GoFishNode;
  public datum?: any;
  // private inferDomains: (childDomains: Size<Domain>[]) => FancySize<Domain | undefined>;
  private _resolveUnderlyingSpace: ResolveUnderlyingSpace;
  private _underlyingSpace?: Size<UnderlyingSpace> = undefined;
  private _inferSizeDomains: InferSizeDomains;
  private _layout: Layout;
  private _render: Render;
  public children: GoFishAST[];
  public intrinsicDims?: Dimensions;
  public transform?: Transform;
  public shared: Size<boolean>;
  // public posDomains: Size<Domain | undefined> = [undefined, undefined];
  private sizeDomains: Size<ScaleFactorFunction>;
  private renderData?: any;
  public coordinateTransform?: CoordinateTransform;
  public color?: MaybeValue<string>;
  constructor(
    {
      name,
      key,
      type,
      args,
      // inferDomains,
      resolveUnderlyingSpace,
      inferSizeDomains,
      layout,
      render,
      shared = [false, false],
      color,
    }: {
      name?: string;
      key?: string;
      type: string;
      args?: any;
      // inferDomains: (childDomains: Size<Domain>[]) => FancySize<Domain | undefined>;
      /* TODO: I'm not sure whether scale inference and sizeThatFits should be separate or the same pass*/
      resolveUnderlyingSpace: ResolveUnderlyingSpace;
      inferSizeDomains: InferSizeDomains;
      layout: Layout;
      render: Render;
      shared?: Size<boolean>;
      color?: MaybeValue<string>;
    },
    children: GoFishAST[]
  ) {
    // Generate unique ID
    this.uid = `node-${GoFishNode.uidCounter++}`;
    // this.inferDomains = inferDomains;
    this._resolveUnderlyingSpace = resolveUnderlyingSpace;
    this._inferSizeDomains = inferSizeDomains;
    this._layout = layout;
    this._render = render;
    this.children = children;
    children.forEach((child) => {
      child.parent = this;
    });
    this._name = name;
    this.key = key;
    this.type = type;
    this.args = args;
    this.shared = shared;
    this.color = color;
  }

  public resolveColorScale(): void {
    const scaleContext = getScaleContext();
    if (this.color !== undefined && isValue(this.color)) {
      const color = getValue(this.color);
      if (!scaleContext.unit.color.has(color)) {
        scaleContext.unit.color.set(
          color,
          color6[scaleContext.unit.color.size % 6]
        );
      }
    }

    this.children.forEach((child) => {
      if (child instanceof GoFishNode) {
        child.resolveColorScale();
      }
    });
  }

  public resolveNames(): void {
    if (this._name !== undefined) {
      getScopeContext().set(this._name, this);
    }
    this.children.forEach((child) => {
      child.resolveNames();
    });
  }

  public resolveKeys(): void {
    if (this.key !== undefined) {
      getKeyContext()[this.key] = this;
    }
    this.children.forEach((child) => {
      child.resolveKeys();
    });
  }

  public resolveUnderlyingSpace(): Size<UnderlyingSpace> {
    if (this._underlyingSpace) {
      return this._underlyingSpace;
    }
    this._underlyingSpace = elaborateSize(
      this._resolveUnderlyingSpace(
        this.children.map((child) => child.resolveUnderlyingSpace())
      )
    );
    return this._underlyingSpace;
  }

  public inferSizeDomains(): Size<ScaleFactorFunction> {
    const sizeDomains = elaborateSize(
      this._inferSizeDomains(this.shared, this.children)
    );

    this.sizeDomains = sizeDomains;
    return sizeDomains;
  }

  public layout(
    size: Size,
    scaleFactors: Size<number | undefined>,
    posScales: Size<((pos: number) => number) | undefined>
  ): Placeable {
    const { intrinsicDims, transform, renderData } = this._layout(
      this.shared,
      size,
      scaleFactors,
      this.children,
      this.sizeDomains,
      posScales
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
      } else if (this.transform?.translate?.[i] === undefined) {
        this.transform!.translate![i] = elabPos[i]!;
      } else {
        // console.warn(
        //   "placing node with both intrinsic and transform defined:",
        //   this.type,
        //   this.transform!.translate![i]
        // );
        // this.transform!.translate![i] = elabPos[i]! - (this.intrinsicDims![i].min ?? 0);
      }
    }
  }

  public embed(direction: FancyDirection): void {
    this.intrinsicDims![elaborateDirection(direction)].embedded = true;
  }

  public INTERNAL_render(
    coordinateTransform?: CoordinateTransform
  ): JSX.Element {
    return this._render(
      {
        intrinsicDims: this.intrinsicDims,
        transform: this.transform,
        renderData: this.renderData,
        /* TODO: do we want to add this as an object property? */
        coordinateTransform: coordinateTransform,
      },
      this.children.map((child) =>
        child.INTERNAL_render(
          this.type !== "box" ? coordinateTransform : undefined
        )
      )
    );
  }

  public render(
    container: HTMLElement,
    {
      w,
      h,
      x,
      y,
      transform,
      debug = false,
      defs,
      axes = false,
    }: {
      w: number;
      h: number;
      x?: number;
      y?: number;
      transform?: { x?: number; y?: number };
      debug?: boolean;
      defs?: JSX.Element[];
      axes?: boolean;
    }
  ) {
    return gofish(
      container,
      { w, h, x, y, transform, debug, defs, axes },
      this
    );
  }

  public name(name: string): this {
    this._name = name;
    return this;
  }

  public setKey(key: string): this {
    this.key = key;
    return this;
  }

  public setShared(shared: Size<boolean>): this {
    this.shared = shared;
    return this;
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

export const findLeastCommonAncestor = (
  node1: GoFishNode,
  node2: GoFishNode
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

const isGoFishNode = (node: GoFishNode | GoFishAST): node is GoFishNode => {
  return "intrinsicDims" in node && "transform" in node && "dims" in node;
};

export const debugNodeTree = (
  node: GoFishNode | GoFishAST,
  indent: string = ""
): void => {
  // Get the name for display (handle both GoFishNode and GoFishRef)
  const nodeName = isGoFishNode(node) ? node._name : node.name;

  // Create a group for this node
  console.group(
    `${indent}Node: ${node.type}${nodeName ? ` (${nodeName})` : ""}`
  );

  // Only print GoFishNode specific properties
  if (isGoFishNode(node)) {
    // Print intrinsic dimensions
    if (node.intrinsicDims) {
      console.group(`${indent}Intrinsic Dimensions`);
      node.intrinsicDims.forEach(
        (
          dim: { min?: number; center?: number; max?: number; size?: number },
          i: number
        ) => {
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
        }
      );
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
    console.log(
      `${indent}Combined Dimensions: ${JSON.stringify(node.dims, null, 2)}`
    );
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

export const debugUnderlyingSpaceTree = (
  node: GoFishNode | GoFishAST,
  indent: string = ""
): void => {
  // Get the underlying space for this node
  const underlyingSpace = node.resolveUnderlyingSpace();

  // Format the underlying space for display
  const formatUnderlyingSpace = (
    space: UnderlyingSpace | Size<UnderlyingSpace>
  ): string => {
    if (Array.isArray(space)) {
      return `[${space
        .map((s) => {
          if (isPOSITION(s)) {
            return `position(${toJSON(s.domain)})`;
          } else if (isDIFFERENCE(s)) {
            return `difference(${s.width})`;
          } else if (isORDINAL(s)) {
            return `ordinal(${s.spacing})`;
          } else if (isUNDEFINED(s)) {
            return `undefined`;
          } else {
            return s.kind;
          }
        })
        .join(", ")}]`;
    } else {
      if (isPOSITION(space)) {
        return `position(${toJSON(space.domain)})`;
      } else if (isDIFFERENCE(space)) {
        return `difference(${space.width})`;
      } else if (isORDINAL(space)) {
        return `ordinal(${space.spacing})`;
      } else if (isUNDEFINED(space)) {
        return `undefined`;
      } else {
        return space.kind;
      }
    }
  };

  // Get the name for display (handle both GoFishNode and GoFishRef)
  const nodeName = isGoFishNode(node) ? node._name : node.name;
  const hasChildren =
    "children" in node && node.children && node.children.length > 0;

  // Create a group for this node only if it has children
  if (hasChildren) {
    console.group(
      `${indent}${node.type}${nodeName ? ` (${nodeName})` : ""} → ${formatUnderlyingSpace(underlyingSpace)}`
    );
  } else {
    console.log(
      `${indent}${node.type}${nodeName ? ` (${nodeName})` : ""} → ${formatUnderlyingSpace(underlyingSpace)}`
    );
  }

  // Print children
  if (hasChildren) {
    node.children.forEach((child) => {
      debugUnderlyingSpaceTree(child, indent + "  ");
    });
    console.groupEnd();
  }
};

export const debugInputSceneGraph = (
  node: GoFishNode | GoFishAST,
  indent: string = ""
): void => {
  // Get the name for display (handle both GoFishNode and GoFishRef)
  const nodeName = isGoFishNode(node) ? node._name : node.name;
  const hasChildren =
    "children" in node && node.children && node.children.length > 0;

  // Format args for display
  const formatArgs = (args: any): string => {
    if (args === undefined || args === null) {
      return "";
    }

    const formatValue = (val: any): string => {
      if (
        typeof val === "object" &&
        val !== null &&
        "type" in val &&
        val.type === "datum"
      ) {
        return `v(${JSON.stringify(val.datum)})`;
      } else if (Array.isArray(val)) {
        const formattedArray = val.map(formatValue);
        return `[${formattedArray.join(", ")}]`;
      } else if (typeof val === "object" && val !== null) {
        const formattedObj = Object.entries(val).map(
          ([key, nestedVal]) => `${key}: ${formatValue(nestedVal)}`
        );
        return `{${formattedObj.join(", ")}}`;
      }
      return JSON.stringify(val);
    };

    try {
      if (Array.isArray(args)) {
        const formattedArray = args.map(formatValue);
        return ` [${formattedArray.join(", ")}]`;
      } else if (typeof args === "object") {
        const formattedObj = Object.entries(args).map(
          ([key, val]) => `${key}: ${formatValue(val)}`
        );
        return ` {${formattedObj.join(", ")}}`;
      } else {
        return ` ${formatValue(args)}`;
      }
    } catch {
      return ` [Object]`;
    }
  };

  // Create a group for this node only if it has children
  if (hasChildren) {
    console.group(
      `${indent}${node.type}${nodeName ? ` (${nodeName})` : ""}${isGoFishNode(node) ? formatArgs(node.args) : ""}`
    );
  } else {
    console.log(
      `${indent}${node.type}${nodeName ? ` (${nodeName})` : ""}${isGoFishNode(node) ? formatArgs(node.args) : ""}`
    );
  }

  // Print children
  if (hasChildren) {
    node.children.forEach((child) => {
      debugInputSceneGraph(child, indent + "  ");
    });
    console.groupEnd();
  }
};
