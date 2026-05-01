import { Spread } from "./spread";
import { GoFishAST } from "../_ast";
import { Collection } from "lodash";

export const spreadY = (...args: any[]): ReturnType<typeof Spread> => {
  if (args.length === 2) {
    const [props, children] = args;
    return Spread(
      {
        ...props,
        dir: "y",
      },
      children
    );
  } else if (args.length === 1) {
    const [children] = args;
    return Spread(
      {
        dir: "y",
      },
      children
    );
  } else {
    return Spread({
      dir: "y",
    });
  }
};
