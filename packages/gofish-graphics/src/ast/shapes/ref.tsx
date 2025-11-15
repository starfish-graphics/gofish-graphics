import { GoFishRef } from "../_ref";
import { GoFishNode } from "../_node";

export const ref = (selectionOrNode: string | GoFishNode) => {
  if (typeof selectionOrNode === "string") {
    return new GoFishRef({ selection: selectionOrNode });
  } else {
    return new GoFishRef({ node: selectionOrNode });
  }
};
