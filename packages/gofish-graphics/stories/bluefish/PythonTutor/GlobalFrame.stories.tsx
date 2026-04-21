import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { Constraint, For, Layer, Spread, rect, text } from "../../../src/lib";
import { stackSlot } from "./stackSlot";

const meta: Meta = {
  title: "Bluefish/Python Tutor/Global Frame",
  argTypes: {
    w: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
    h: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
    },
  },
};
export default meta;

type Args = { w: number; h: number };

const variables = [
  { variable: "c", value: 0 },
  { variable: "d", value: 0 },
  { variable: "x", value: 5 },
];
export const GlobalFrame: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      rect({ h: 300, w: 200, fill: "#e2ebf6" }).name("frame"),
      rect({ h: 300, w: 5, fill: "#a6b3b6" }).name("frameBorder"),
      text({
        fontSize: 24,
        fontFamily: "Andale Mono, monospace",
        fill: "black",
        text: "Global Frame",
      }).name("label"),
      Spread(
        { direction: "y", alignment: "end", spacing: 10, reverse: true },
        For(variables, (v) =>
          stackSlot({ variable: v.variable, value: String(v.value) })
        )
      ).name("variables"),
    ])
      .constrain(({ label, frame, frameBorder, variables }) => [
        Constraint.align({ x: "middle", y: "end" }, [label, frame]),
        Constraint.align({ x: "start", y: "middle" }, [frameBorder, frame]),
        Constraint.align({ x: "end" }, [variables, label]),
        Constraint.distribute({ dir: "y", spacing: 10 }, [variables, label]),
      ])
      .render(container, {
        w: args.w,
        h: args.h,
      });
    return container;
  },
};
