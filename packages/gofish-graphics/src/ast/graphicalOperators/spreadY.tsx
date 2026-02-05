import { spread } from "./spread";
import { GoFishAST } from "../_ast";
import { Collection } from "lodash";

export const spreadY = (
  ...args: any[]
): ReturnType<typeof spread> => {
  if (args.length === 2) {
    const [props, children] = args;
    return spread(
      {
        ...props,
        direction: "y",
      },
      children
    );
  } else if (args.length === 1) {
    const [children] = args;
    return spread(
      {
        direction: "y",
      },
      children
    );
  } else {
    return spread({
      direction: "y",
    });
  }
};
