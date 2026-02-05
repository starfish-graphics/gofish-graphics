import { spread } from "./spread";
import { GoFishAST } from "../_ast";
import { Collection } from "lodash";

export const spreadX = (
  ...args: any[]
): ReturnType<typeof spread> => {
  if (args.length === 2) {
    const [props, children] = args;
    return spread(
      {
        ...props,
        direction: "x",
      },
      children
    );
  } else if (args.length === 1) {
    const [children] = args;
    return spread(
      {
        direction: "x",
      },
      children
    );
  } else {
    return spread({
      direction: "x",
    });
  }
};
