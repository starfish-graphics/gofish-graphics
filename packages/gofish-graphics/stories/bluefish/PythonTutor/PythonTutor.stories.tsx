import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../../helper";
import { Spread } from "../../../src/lib";
import { globalFrame } from "./globalFrame";
import { heap } from "./heap";
import { binding, pointer, tuple } from "./types";

const meta: Meta = {
  title: "Bluefish/Python Tutor/Python Tutor",
  argTypes: {
    w: {
      control: { type: "number", min: 400, max: 2000, step: 20 },
    },
    h: {
      control: { type: "number", min: 200, max: 1200, step: 20 },
    },
  },
};
export default meta;

type Args = { w: number; h: number };

export const PythonTutor: StoryObj<Args> = {
  args: { w: 1250, h: 600 },
  render: (args: Args) => {
    const container = initializeContainer();
    const data = {
      stack: [
        binding("c", pointer(0)),
        binding("d", pointer(1)),
        binding("x", "5"),
      ],
      heap: [
        tuple(["12", pointer(1), "1", "0", pointer(2), pointer(3)]),
        tuple(["1", "4"]),
        tuple(["3", "10", "7", "8", pointer(4)]),
        tuple(["2", pointer(4)]),
        tuple(["3"]),
      ],
      heapArrangement: [
        [0, 3, null, null],
        [null, 1, 2, 4],
      ],
    };

    Spread({ direction: "x", alignment: "start", spacing: 100 }, [
      globalFrame({ stack: data.stack }),
      heap({ heap: data.heap, heapArrangement: data.heapArrangement }),
    ]).render(container, { w: args.w, h: args.h });

    return container;
  },
};
