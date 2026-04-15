import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Constraint, For, Layer, rect, ref, Spread, text } from "../../src/lib";

const meta: Meta = {
  title: "Low Level Syntax/Python Tutor",
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
      Spread({ direction: "y", alignment: "end", spacing: 10 }, [
        Spread(
          {
            direction: "y",
            alignment: "start",
            /* TODO: changing this wildly changes other positions... */ spacing: 10,
          },
          For(variables, (variable, i) =>
            text({
              fontSize: 24,
              fontFamily: "Andale Mono, monospace",
              fill: "black",
              text: `${variable.variable}: ${variable.value}`,
            })
          )
        ),
        /* TODO: this should really be on top... */
        ref("label"),
      ]),
    ])
      .constrain(({ label, frame, frameBorder }) => [
        Constraint.align({ dir: "x", alignment: "middle" }, [label, frame]),
        Constraint.align({ dir: "y", alignment: "end" }, [label, frame]),
        Constraint.align({ dir: "x", alignment: "start" }, [
          frameBorder,
          frame,
        ]),
        Constraint.align({ dir: "y", alignment: "middle" }, [
          frameBorder,
          frame,
        ]),
      ])
      .render(container, {
        w: args.w,
        h: args.h,
      });
    return container;
  },
};
