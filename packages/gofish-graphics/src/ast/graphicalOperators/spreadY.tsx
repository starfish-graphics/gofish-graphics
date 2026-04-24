import { spread } from "./spread";
import { GoFishAST } from "../_ast";
import { Collection } from "lodash";

export const spreadY = (...args: any[]): ReturnType<typeof spread> => {
  if (args.length === 2) {
    const [props, children] = args;
    return spread(
      {
        ...props,
        dir: "y",
      },
      children
    );
  } else if (args.length === 1) {
    const [children] = args;
    return spread(
      {
        dir: "y",
      },
      children
    );
  } else {
    return spread({
      dir: "y",
    });
  }
};
