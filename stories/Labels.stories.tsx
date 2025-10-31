import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";

const meta: Meta = {
  title: "Charts/Labels",
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
export const StartInsetCuston: StoryObj<
  Args & { labelX: string; labelY: string; offsetX: number; offsetY: number }
> = {
  name: "xy custom",
  args: {
    w: 420,
    h: 400,
    labelX: "middle",
    labelY: "middle",
    offsetX: -10,
    offsetY: 10,
  },
  argTypes: {
    labelX: {
      control: {
        type: "select",
      },
      options: [
        "start-inset",
        "start-outset",
        "end-inset",
        "end-outset",
        "middle",
      ],
    },

    labelY: {
      control: {
        type: "select",
      },
      options: [
        "start-inset",
        "start-outset",
        "end-inset",
        "end-outset",
        "middle",
      ],
    },
  },
  render: (
    args: Args & {
      labelX: string;
      labelY: string;
      offsetX: number;
      offsetY: number;
    }
  ) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: {
        x: args.labelX + `:${args.offsetX}`,
        y: args.labelY + `:${args.offsetY}`,
      },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

// Start-inset combinations
export const StartInsetStartInset: StoryObj<Args> = {
  name: "x: start-inset, y: start-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-inset", y: "start-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartInsetStartOutset: StoryObj<Args> = {
  name: "x: start-inset, y: start-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-inset", y: "start-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartInsetEndInset: StoryObj<Args> = {
  name: "x: start-inset, y: end-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-inset", y: "end-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartInsetEndOutset: StoryObj<Args> = {
  name: "x: start-inset, y: end-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-inset", y: "end-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

// Start-outset combinations
export const StartOutsetStartInset: StoryObj<Args> = {
  name: "x: start-outset, y: start-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-outset", y: "start-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartOutsetStartOutset: StoryObj<Args> = {
  name: "x: start-outset, y: start-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-outset", y: "start-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartOutsetEndInset: StoryObj<Args> = {
  name: "x: start-outset, y: end-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-outset", y: "end-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartOutsetEndOutset: StoryObj<Args> = {
  name: "x: start-outset, y: end-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-outset", y: "end-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

// End-inset combinations
export const EndInsetStartInset: StoryObj<Args> = {
  name: "x: end-inset, y: start-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-inset", y: "start-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndInsetStartOutset: StoryObj<Args> = {
  name: "x: end-inset, y: start-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-inset", y: "start-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndInsetEndInset: StoryObj<Args> = {
  name: "x: end-inset, y: end-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-inset", y: "end-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndInsetEndOutset: StoryObj<Args> = {
  name: "x: end-inset, y: end-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-inset", y: "end-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

// End-outset combinations
export const EndOutsetStartInset: StoryObj<Args> = {
  name: "x: end-outset, y: start-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-outset", y: "start-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndOutsetStartOutset: StoryObj<Args> = {
  name: "x: end-outset, y: start-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-outset", y: "start-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndOutsetEndInset: StoryObj<Args> = {
  name: "x: end-outset, y: end-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-outset", y: "end-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndOutsetEndOutset: StoryObj<Args> = {
  name: "x: end-outset, y: end-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-outset", y: "end-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

// Middle combinations - x: middle
export const MiddleStartInset: StoryObj<Args> = {
  name: "x: middle, y: start-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "middle", y: "start-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const MiddleStartOutset: StoryObj<Args> = {
  name: "x: middle, y: start-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "middle", y: "start-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const MiddleEndInset: StoryObj<Args> = {
  name: "x: middle, y: end-inset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "middle", y: "end-inset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const MiddleEndOutset: StoryObj<Args> = {
  name: "x: middle, y: end-outset",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "middle", y: "end-outset" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const MiddleMiddle: StoryObj<Args> = {
  name: "x: middle, y: middle",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "middle", y: "middle" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

// Middle combinations - y: middle
export const StartInsetMiddle: StoryObj<Args> = {
  name: "x: start-inset, y: middle",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-inset", y: "middle" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const StartOutsetMiddle: StoryObj<Args> = {
  name: "x: start-outset, y: middle",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "start-outset", y: "middle" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndInsetMiddle: StoryObj<Args> = {
  name: "x: end-inset, y: middle",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-inset", y: "middle" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};

export const EndOutsetMiddle: StoryObj<Args> = {
  name: "x: end-outset, y: middle",
  args: { w: 420, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    return rect(catchData, {
      fill: "lake",
      w: "count",
      label: { x: "end-outset", y: "middle" },
    })
      .spreadY("lake")
      .render(container, { w: args.w, h: args.h, axes: true });
  },
};
