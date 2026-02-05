import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "./helper";

import _, { groupBy, orderBy } from "lodash";
import { clock } from "../src/ast/coordinateTransforms/clock";
import { nightingale } from "../src/data/nightingale";
import { drivingShifts } from "../src/data/drivingShifts";

import { color, color6, gray, neutral } from "../src/color";
import { seafood, catchLocations, catchLocationsArray, CatchData, catchData } from "../src/data/catch";
import { titanic } from "../src/data/titanic";
import { streamgraphData } from '../src/data/streamgraphData';
import { penguins } from '../src/data/penguins';
import { mix } from "spectral.js";

import { density1d } from 'fast-kde';

import { caltrain, caltrainStopOrder } from '../src/data/caltrain';

import {
  frame as Frame,
  Ellipse,
  Rect,
  Wavy,
  For,
  Petal,
  StackX,
  Polar,
  StackY,
  v,
  Enclose,
  Ref,
  ConnectX,
  ConnectY,
  SpreadY,
  SpreadX,
} from "../src/lib";

const meta: Meta = {
  title: "Low Level Syntax",
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


const scatterData = _(seafood)
  .groupBy("lake")
  .map((lakeData, lake) => ({
    lake,
    x: catchLocations[lake].x,
    y: catchLocations[lake].y,
    collection: lakeData.map((item) => ({
      species: item.species,
      count: item.count,
    })),
  }))
  .value();

export const BalloonChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();

    const colorMap = {
      0: color.red,
      1: color.blue,
      2: color.green,
      3: color.yellow,
      4: color.purple,
      5: color.orange,
    };

    const Balloon = (options) =>
      Frame(
        {
          x: options?.x - 15 * (options?.scale ?? 1),
          y: options?.y + 27 * (options?.scale ?? 1),
          box: true,
          transform: {
            scale: { x: options?.scale ?? 1, y: (options?.scale ?? 1) * -1 },
          },
        },
        [
          Ellipse({
            cx: 15,
            cy: 15,
            w: 24,
            h: 30,
            fill: (options?.color ?? color.red)[4],
          }),
          Ellipse({
            cx: 12,
            cy: 11,
            w: 7,
            h: 11,
            fill: (options?.color ?? color.red)[3],
          }),
          Rect({
            cx: 15,
            cy: 32,
            w: 8,
            h: 4,
            fill: (options?.color ?? color.red)[5],
            rx: 3,
            ry: 2,
          }),
          Rect({
            cx: 15,
            cy: 32,
            w: 5,
            h: 2.4,
            fill: (options?.color ?? color.red)[6],
            rx: 2,
            ry: 1,
          }),
        ]
      );

    Frame(
      { coord: Wavy(), x: 0, y: 0 },
      scatterData.map((data, i) =>
        Frame({ x: data.x }, [
          Rect({
            x: 0,
            y: 0,
            // x: data.x,
            // y: data.y,
            w: 1,
            h: data.y,
            emY: true,
            fill: color.black,
          }),
          Balloon({
            scale: 1,
            x: 0,
            y: data.y,
            color: /* colorMap[i % 6] */[
              null,
              null,
              null,
              mix(color6[i % 6], color.white, 0.5),
              color6[i % 6],
              mix(color6[i % 6], color.black, 0.1),
              mix(color6[i % 6], color.black, 0.35),
            ],
          }),
        ])
      )
    ).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  },
};

export const FlowerChart: StoryObj<Args> = {
  args: { w: 400, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    Frame(
      For(scatterData, (sample) =>
        Frame({ x: sample.x }, [
          Rect({
            w: 2,
            h: sample.y,
            fill: color.green[5],
          }),
          Frame(
            {
              y: sample.y,
              coord: Polar(),
            },
            [
              StackX(
                {
                  h: _(sample.collection).sumBy("count") / 7,
                  spacing: 0,
                  alignment: "start",
                  sharedScale: true,
                },
                For(sample.collection, (d, i) =>
                  Petal({
                    w: v(d.count),
                    fill: mix(color6[i % 6], color.white, 0.5),
                  })
                )
              ),
            ]
          ),
        ])
      )
    ).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });

    return container;
  }
}

const classColor = {
  First: color6[0],
  Second: color6[1],
  Third: color6[2],
  Crew: color6[3],
};

export const IcicleChart: StoryObj<Args> = {
  args: { w: 500, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();

    StackX({ alignment: "middle" }, [
      Rect({
        w: 40,
        h: _(titanic).sumBy("count") / 10,
        fill: neutral,
      }),
      StackY(
        { dir: "ttb", alignment: "middle" },
        _(titanic)
          .groupBy("class")
          .map((items, cls) =>
            StackX(
              {
                h: _(items).sumBy("count") / 10,
                spacing: 0,
                alignment: "start",
              },
              [
                Rect({ w: 40, fill: classColor[cls] }),
                StackY(
                  { dir: "ttb", alignment: "middle" },
                  _(items)
                    .groupBy("sex")
                    .map((items, sex) =>
                      StackX({ alignment: "middle" }, [
                        Rect({
                          w: 0,
                          h: _(items).sumBy("count") / 10,
                          fill: sex === "Female" ? color6[4] : color6[5],
                        }),
                        StackY(
                          {
                            w: 40,
                            dir: "ttb",
                            alignment: "middle",
                          },
                          _(items)
                            .groupBy("survived")
                            .map((survivedItems, survived) => {
                              return Rect({
                                h: _(survivedItems).sumBy("count") / 10,
                                fill:
                                  sex === "Female"
                                    ? survived === "No"
                                      ? gray
                                      : color6[4]
                                    : survived === "No"
                                      ? gray
                                      : color6[5],
                              });
                            })
                            .value()
                        ),
                      ])
                    )
                    .value()
                ),
              ]
            )
          )
          .value()
      ),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;

  }
}

export const NestedMosaicChart: StoryObj<Args> = {
  args: { w: 500, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();
    SpreadY(
      { dir: "ttb", spacing: 4, alignment: "middle" },
      For(groupBy(titanic, "class"), (items, cls) =>
        StackX(
          { key: cls, h: _(items).sumBy("count") / 10, spacing: 2, alignment: "middle" },
          For(groupBy(items, "sex"), (sItems, sex) =>
            StackY(
              {
                dir: "ttb",
                w: (_(sItems).sumBy("count") / _(items).sumBy("count")) * 100,
                alignment: "middle",
                sharedScale: true,
              },
              For(groupBy(sItems, "survived"), (items, survived) =>
                Rect({
                  h: v(_(items).sumBy("count")),
                  fill: survived === "No" ? gray : classColor[cls],
                })
              )
            )
          )
        )
      )
    ).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}

export const NestedWaffleChart: StoryObj<Args> = {
  args: { w: 500, h: 340 },
  render: (args: Args) => {
    const container = initializeContainer();
    SpreadY(
      { direction: "y", spacing: 8, alignment: "middle", sharedScale: true },
      _(titanic)
        .groupBy("class")
        .map((cls) =>
          SpreadX(
            { spacing: 4, alignment: "end" },
            _(cls)
              .groupBy("sex")
              .map((sex) =>
                Enclose({}, [
                  SpreadY(
                    { spacing: 0.5, alignment: "end" },
                    _(sex) // Was missing this lodash chain before .reverse()
                      .reverse()
                      .flatMap((d) => Array(d.count).fill(d))
                      .chunk(
                        Math.ceil(
                          (_(sex).sumBy("count") / _(cls).sumBy("count")) * 32
                        )
                      )
                      .reverse()
                      .map((d) =>
                        SpreadX(
                          { spacing: 0.5, alignment: "end" },
                          d.map((d) =>
                            Ellipse({
                              w: 4,
                              h: 4,
                              fill:
                                d.survived === "No"
                                  ? gray
                                  : /* value(d.class) */ classColor[d.class],
                            })
                          )
                        )
                      )
                      .value()
                  ),
                ])
              )
              .value()
          )
        )
        .value()
    ).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}

export const SankeyTree: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    const layerSpacing = 64;
    const internalSpacing = 2;
    Frame([
      SpreadX({ spacing: layerSpacing, alignment: "middle" }, [
        StackY(
          { spacing: 0, alignment: "middle" },
          For(groupBy(titanic, "class"), (items, cls) =>
            Rect({
              w: 40,
              h: _(items).sumBy("count") / 10,
              fill: neutral,
            }).name(`${cls}-src`)
          )
        ),
        SpreadY(
          { spacing: internalSpacing, alignment: "middle" },
          For(groupBy(titanic, "class"), (items, cls) =>
            SpreadX({ spacing: layerSpacing, alignment: "middle" }, [
              StackY(
                { spacing: 0, alignment: "middle" },
                For(groupBy(items, "sex"), (items, sex) =>
                  Rect({
                    w: 40,
                    h: _(items).sumBy("count") / 10,
                    fill: classColor[cls],
                  }).name(`${cls}-${sex}-src`)
                )
              ).name(`${cls}-tgt`),
              SpreadY(
                {
                  h: _(items).sumBy("count") / 10,
                  spacing: internalSpacing * 2,
                  alignment: "middle",
                },
                For(groupBy(items, "sex"), (items, sex) =>
                  SpreadX({ spacing: layerSpacing, alignment: "middle" }, [
                    StackY(
                      {
                        spacing: 0,
                        alignment: "middle",
                      },
                      For(groupBy(items, "survived"), (survivedItems, survived) =>
                        Rect({
                          w: 40,
                          h: _(survivedItems).sumBy("count") / 10,
                          fill: sex === "Female" ? color6[4] : color6[5],
                        }).name(`${cls}-${sex}-${survived}-src`)
                      )
                    ).name(`${cls}-${sex}-tgt`),
                    SpreadY(
                      {
                        w: 40,
                        spacing: internalSpacing * 4,
                        alignment: "middle",
                      },
                      For(groupBy(items, "survived"), (survivedItems, survived) => {
                        return Rect({
                          h: _(survivedItems).sumBy("count") / 10,
                          fill:
                            sex === "Female"
                              ? survived === "No"
                                ? gray
                                : color6[4]
                              : survived === "No"
                                ? gray
                                : color6[5],
                        }).name(`${cls}-${sex}-${survived}-tgt`);
                      })
                    ),
                  ])
                )
              ),
            ])
          )
        ),
      ]),
      For(groupBy(titanic, "class"), (items, cls) => [
        ConnectX(
          {
            fill: classColor[cls],
            interpolation: "bezier",
            opacity: 0.7,
          },
          [Ref(`${cls}-src`), Ref(`${cls}-tgt`)]
        ),
        For(groupBy(items, "sex"), (sexItems, sex) => [
          ConnectX(
            {
              fill: sex === "Female" ? color6[4] : color6[5],
              interpolation: "bezier",
              opacity: 0.7,
            },
            [Ref(`${cls}-${sex}-src`), Ref(`${cls}-${sex}-tgt`)]
          ),
          For(groupBy(sexItems, "survived"), (survivedItems, survived) =>
            ConnectX(
              {
                fill:
                  sex === "Female"
                    ? survived === "No"
                      ? gray
                      : color6[4]
                    : survived === "No"
                      ? gray
                      : color6[5],
                interpolation: "bezier",
                opacity: 0.7,
              },
              [
                Ref(`${cls}-${sex}-${survived}-src`),
                Ref(`${cls}-${sex}-${survived}-tgt`),
              ]
            )
          ),
        ]),
      ]),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}

export const StringlineChart: StoryObj<Args> = {
  args: { w: 500, h: 400 },
  render: (args: Args) => {
    const container = initializeContainer();
    const caltrainProcessed = caltrain.filter((d) => d.Type !== "Bullet");

    Frame({}, [
      SpreadY(
        {
          dir: "ttb",
          spacing: 8,
          alignment: "start",
        },
        For(
          groupBy(
            _.orderBy(
              caltrainProcessed,
              (d) => caltrainStopOrder.indexOf(d.Station),
              "desc"
            ),
            "Station"
          ),
          (d, key) =>
            Frame({ key }, [
              Rect({ w: 0, h: 0 }),
              For(d, (d) =>
                Ellipse({ x: d.Time / 3, w: 4, h: 4, fill: v(d.Direction) }).name(
                  `${d.Train}-${d.Station}-${d.Time}`
                )
              ),
            ])
        )
      ),
      For(groupBy(caltrainProcessed, "Train"), (d) =>
        ConnectY(
          { strokeWidth: 1, mode: "center-to-center" },
          For(d, (d) => Ref(`${d.Train}-${d.Station}-${d.Time}`))
        )
      ),
    ]).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}

export const ViolinPlot: StoryObj<Args> = {
  args: { w: 500, h: 300 },
  render: (args: Args) => {
    const container = initializeContainer();

    SpreadX(
      { spacing: 64, sharedScale: true },
      For(groupBy(penguins, "Species"), (d, species) => {
        const density = Array.from(
          density1d(d.map((p) => p["Body Mass (g)"]).filter((w) => w !== null))
        );
        return Frame({}, [
          StackY(
            { spacing: 0 },
            For(density, (d) =>
              Rect({ y: d.x / 40, w: d.y * 100000, h: 0, fill: v(species) }).name(
                `${species}-${d.x}`
              )
            )
          ),
          ConnectY(
            { opacity: 1, mixBlendMode: "normal" },
            For(density, (d) => Ref(`${species}-${d.x}`))
          ),
        ]);
      })
    ).render(container, {
      w: args.w,
      h: args.h,
      axes: true,
    });
    return container;
  }
}