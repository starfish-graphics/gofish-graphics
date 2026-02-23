import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { Constraint, For, Layer, Rect, Spread, Text } from "../../src/lib";

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

export const GlobalFrameConstraints: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ h: 300, w: 200, fill: "#e2ebf6" }).name("frame"),
      Rect({ h: 300, w: 5, fill: "#a6b3b6" }).name("border"),
      Text({
        fontSize: 24,
        fontFamily: "Andale Mono, monospace",
        fill: "black",
        text: "Global Frame",
      }).name("title"),
      For(variables, (v, i) =>
        Text({
          fontSize: 24,
          fontFamily: "Andale Mono, monospace",
          fill: "black",
          text: `${v.variable}: ${v.value}`,
        }).name(`var-${i}`)
      ),
    ])
      .constrain(({ frame, border, title, ...vars }) => {
        const allVars = Object.values(vars);
        return [
          Constraint.align("x", "end", [frame, border, title, ...allVars]),
          Constraint.distribute("y", { spacing: 10, order: "forward" }, [
            title,
            ...allVars,
          ]),
        ];
      })
      .render(container, {
        w: args.w,
        h: args.h,
      });
    return container;
  },
};

export const GlobalFrame: StoryObj<Args> = {
  args: { w: 320, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Layer([
      Rect({ h: 300, w: 200, fill: "#e2ebf6" }).name("frame"),
      Rect({ h: 300, w: 5, fill: "#a6b3b6" }).name("frame-border"),
      Spread({ direction: "y", dir: "ttb", alignment: "end", spacing: 10 }, [
        Text({
          fontSize: 24,
          fontFamily: "Andale Mono, monospace",
          fill: "black",
          text: "Global Frame",
        }).name("label"),
        Spread(
          { direction: "y", alignment: "end", spacing: 10 },
          For(variables, (variable, i) =>
            Text({
              fontSize: 24,
              fontFamily: "Andale Mono, monospace",
              fill: "black",
              text: `${variable.variable}: ${variable.value}`,
            }).name(`variable-${i}`)
          )
        ),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });
    return container;
  },
};
