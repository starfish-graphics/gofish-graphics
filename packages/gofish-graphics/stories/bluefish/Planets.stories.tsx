import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import { For, Stack, Spread, Ellipse, Layer, Text, Ref, Arrow } from "../../src/lib";

const meta: Meta = {
  title: "Bluefish/Planets",
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

const planets = [
  { name: "Mercury", radius: 15, color: "#EBE3CF" },
  { name: "Venus", radius: 36, color: "#DC933C" },
  { name: "Earth", radius: 38, color: "#179DD7" },
  { name: "Mars", radius: 21, color: "#F1CF8E" },
];

export const PlanetsOnly: StoryObj<Args> = {
  args: { w: 800, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Spread(
      { direction: "x", spacing: 50, alignment: "middle" },
      For(planets, (planet) =>
        Ellipse({
          w: planet.radius * 2,
          h: planet.radius * 2,
          fill: planet.color,
          stroke: "#333",
          strokeWidth: 3,
        })
      )
    ).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PlanetsWithLabelAbove: StoryObj<Args> = {
  args: { w: 800, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Layer([
      Spread(
        { direction: "x", spacing: 50, alignment: "middle" },
        For(planets, (planet) =>
          Ellipse({
            w: planet.radius * 2,
            h: planet.radius * 2,
            fill: planet.color,
            stroke: "#333",
            strokeWidth: 3,
          }).name(planet.name)
        )
      ),
      Spread({ direction: "y", spacing: 60, alignment: "middle" }, [
        Ref("Mercury"),
        Text({ text: "Mercury" }),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PlanetsWithLabelBelow: StoryObj<Args> = {
  args: { w: 800, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Layer([
      Spread(
        { direction: "x", spacing: 50, alignment: "middle" },
        For(planets, (planet) =>
          Ellipse({
            w: planet.radius * 2,
            h: planet.radius * 2,
            fill: planet.color,
            stroke: "#333",
            strokeWidth: 3,
          }).name(planet.name)
        ) 
      ),
      Spread({ direction: "y", spacing: 60, alignment: "middle" }, [
        Text({ text: "Mercury" }),
        Ref("Mercury"),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PlanetsWithLabelAboveNoSpacing: StoryObj<Args> = {
  args: { w: 800, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Layer([
      Spread(
        { direction: "x", spacing: 50, alignment: "middle" },
        For(planets, (planet) =>
          Ellipse({
            w: planet.radius * 2,
            h: planet.radius * 2,
            fill: planet.color,
            stroke: "#333",
            strokeWidth: 3,
          }).name(planet.name)
        )
      ),
      Spread({ direction: "y", spacing: 0, alignment: "middle" }, [
        Ref("Mercury"),
        Text({ text: "Mercury", debugBoundingBox: true }),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PlanetsWithLabelBelowNoSpacing: StoryObj<Args> = {
  args: { w: 800, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Layer([
      Spread(
        { direction: "x", spacing: 50, alignment: "middle" },
        For(planets, (planet) =>
          Ellipse({
            w: planet.radius * 2,
            h: planet.radius * 2,
            fill: planet.color,
            stroke: "#333",
            strokeWidth: 3,
          }).name(planet.name)
        )
      ),
      Spread({ direction: "y", spacing: 0, alignment: "middle" }, [
        Text({ text: "Mercury", debugBoundingBox: true }),
        Ref("Mercury"),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};

export const PlanetsWithArrow: StoryObj<Args> = {
  args: { w: 800, h: 200 },
  render: (args: Args) => {
    const container = initializeContainer();

    Layer([
      Spread(
        { direction: "x", spacing: 50, alignment: "middle" },
        For(planets, (planet) =>
          Ellipse({
            w: planet.radius * 2,
            h: planet.radius * 2,
            fill: planet.color,
            stroke: "#333",
            strokeWidth: 3,
          }).name(planet.name)
        )
      ),
      Spread({ direction: "y", spacing: 60, alignment: "middle" }, [
        Text({ text: "Mercury" }).name("label"),
        Ref("Mercury"),
      ]),
      Arrow({}, [Ref("label"), Ref("Mercury")]),
    ]).render(container, {
      w: args.w,
      h: args.h,
    });

    return container;
  },
};
