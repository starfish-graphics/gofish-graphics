import { GoFishRef } from "../_ref";
import { GoFishNode } from "../_node";

export const ref = (
  selectionOrNode: string | GoFishNode | { __ref: GoFishNode }
) => {
  if (typeof selectionOrNode === "string") {
    return new GoFishRef({ selection: selectionOrNode });
  } else if ("__ref" in selectionOrNode) {
    return new GoFishRef({ node: selectionOrNode.__ref });
  } else {
    return new GoFishRef({ node: selectionOrNode });
  }
};
