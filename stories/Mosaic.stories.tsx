
import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "./helper";
import { testNestedMosaic } from "../src/tests/nestedMosaic";
import { rect } from "../src/ast/marks/chart";
import { catchData } from "../src/data/catch";
import { orderBy } from "../src/lib";

export default {
	title: "Charts/Mosaic",
	argTypes: {
		w: {
			control: { type: "number", min: 100, max: 1000, step: 10 },
			defaultValue: 500,
		},
		h: {
			control: { type: "number", min: 100, max: 1000, step: 10 },
			defaultValue: 400,
		},
	},
} as Meta;

type Args = { w: number; h: number };

export const NestedMosaic: StoryObj<Args> = {
	args: { w: 500, h: 400 },
	render: (args: Args) => {
		const container = initializeContainer();
		testNestedMosaic().render(container, {
			w: args.w,
			h: args.h,
			axes: true,
		});
		return container;
	},
};

export const Mosaic: StoryObj<Args> = {
	args: { w: 500, h: 400 },
	render: (args: Args) => {
		const container = initializeContainer();
		rect(catchData, { fill: "species", h: "count" })
			.stackY("species", { w: "count" })
			.transform((d) => orderBy(d, "count", "asc"))
			.spreadX("lake")
			.render(container, {
				w: args.w,
				h: args.h,
				axes: true,
			});
		return container;
	},
};
