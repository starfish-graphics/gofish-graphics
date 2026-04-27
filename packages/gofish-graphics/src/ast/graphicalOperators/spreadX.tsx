import { Spread } from "./spread";
import { GoFishAST } from "../_ast";
import { Collection } from "lodash";

export const spreadX = (...args: any[]): ReturnType<typeof Spread> => {
  if (args.length === 2) {
    const [props, children] = args;
    return Spread(
      {
        ...props,
        dir: "x",
      },
      children
    );
  } else if (args.length === 1) {
    const [children] = args;
    return Spread(
      {
        dir: "x",
      },
      children
    );
  } else {
    return Spread({
      dir: "x",
    });
  }
};
