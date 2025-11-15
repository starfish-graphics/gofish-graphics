import type { Meta, StoryObj } from "@storybook/html";
import { rect } from "../src/ast/marks/chart";
import { initializeContainer } from "./helper";
import { catchData } from "../src/data/catch";
import { orderBy } from "../src/lib";
import { filter_defs } from "../src/ast/texture/temp_filter";

const meta: Meta = {
    title: "Charts/Filters",
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

export const BarFilter: StoryObj<Args> = {
    args: { w: 320, h: 400 },
    render: (args: Args) => {
        const container = initializeContainer();
        return filter_defs.map((filter) => {
            const filter_element: SVGElement = filter! as SVGElement;
            rect(catchData, {
                fill: "lake",
                h: "count",
                filter: `url(#${filter_element.id})`,
            })
                .spreadX("lake").render(container, {
                    w: args.w,
                    h: args.h,
                    axes: true,
                    defs: filter_defs,
                });
        }) as any;

    },
};

// export const StackedFilter: StoryObj<Args> = {
//   args: { w: 420, h: 400 },
//   render: (args: Args) => {
//     const container = initializeContainer();
//     return rect(catchData, { fill: "species", h: "count" })
//       .stackY("species")
//       .transform((d) => orderBy(d, "count", "asc"))
//       .spreadX("lake", { alignment: "start" })
//       .render(container, {
//         w: args.w,
//         h: args.h,
//         axes: true,
//         defs: a,
//       });
//   },
// };
