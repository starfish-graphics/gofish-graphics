import { spread } from "./spread";
import { FancyDims } from "../dims";
import { MaybeValue } from "../data";

// Type definition for props
type StackProps = {
  name?: string;
  key?: string;
  direction: "x" | "y";
  alignment?: "start" | "middle" | "end";
  sharedScale?: boolean;
  reverse?: boolean;
} & FancyDims<MaybeValue<number>>;

export const stack = (
  props: StackProps,
  children: any // GoFishChildrenInput type from ../withGoFish is not exported, using any
): ReturnType<typeof spread> => {
  return spread(
    {
      ...props,
      spacing: 0,
      mode: "edge-to-edge",
    },
    children
  );
};
