import { GoFishRef } from "../_ref";
import { GoFishNode } from "../_node";
import { isToken, Token } from "../createName";

export const ref = (
  selectionOrNode:
    | string
    | Token
    | (Token | string | number)[]
    | GoFishNode
    | { __ref: GoFishNode }
) => {
  if (
    typeof selectionOrNode === "string" ||
    Array.isArray(selectionOrNode) ||
    isToken(selectionOrNode)
  ) {
    return new GoFishRef({ selection: selectionOrNode });
  } else if ("__ref" in selectionOrNode) {
    return new GoFishRef({ node: selectionOrNode.__ref });
  } else {
    return new GoFishRef({ node: selectionOrNode });
  }
};
