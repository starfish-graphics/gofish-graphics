import { lerp, rybHsl2rgb } from "rybitten";
import { ColorCoords, cubes } from "rybitten/cubes";
import { mix, palette } from "spectral.js";
export const rgbToString = (rgb: ColorCoords) => `rgb(${rgb.map((x) => Math.round(x * 255)).join(", ")})`;

export const createColorRange = (hue: number) =>
  Array.from({ length: 10 }, (_, i) => (i + 2) * (1 / (10 + 2)))
    .map((value) => rgbToString(rybHsl2rgb([hue, 1, value])))
    .reverse();

// export const color = {
//   red: createColorRange((0 * 360) / 12),
//   orange: createColorRange((1 * 360) / 12),
//   amber: createColorRange((2 * 360) / 12),
//   /* mellow */ yellow: createColorRange((3 * 360) / 12),
//   // dangeryellow: createColorRange(4 * 360 / 12),
//   lime: createColorRange((5 * 360) / 12),
//   green: createColorRange((6 * 360) / 12),
//   teal: createColorRange((7 * 360) / 12),
//   // blue3: createColorRange((7.5 * 360) / 12),
//   sky: createColorRange((8 * 360) / 12),
//   blue: createColorRange((8.5 * 360) / 12),
//   indigo: createColorRange((9 * 360) / 12),
//   purple: createColorRange((10 * 360) / 12),
//   // idk: createColorRange((10.75 * 360) / 12),
//   fuschia: createColorRange((11 * 360) / 12),
// };

/* generated with help from rybitten */
const baseColors = {
  red: "rgb(227, 36, 33)",
  orange: "rgb(234, 89, 30)",
  amber: "rgb(240, 142, 28)",
  yellow: "rgb(242, 186, 14)",
  lime: "rgb(122, 186, 46)",
  green: "rgb(0, 142, 91)",
  teal: "rgb(11, 147, 155)",
  sky: "rgb(22, 153, 218)",
  blue: "rgb(37, 134, 211)",
  indigo: "rgb(71, 94, 194)",
  purple: "rgb(120, 34, 170)",
  fuschia: "rgb(174, 35, 102)",
};

const baseWhite = "rgb(240, 240, 240)";
const baseBlack = "rgb(10, 10, 10)";

const createPalette = (color: string, white: string = baseWhite, black: string = baseBlack) => {
  // 1-4: color mixed with white (lighter shades)
  // 5: pure color
  // 6-9: color mixed with black (darker shades)

  // slice off values that are either pure white/black or too close to the pure color

  const lighterShades = palette(white, color, 8).slice(0, -3);

  const darkerShades = palette(color, black, 8).slice(2, -2);

  return [...lighterShades, color, ...darkerShades];
};

export const color = {
  white: baseWhite,
  black: baseBlack,
  red: createPalette(baseColors.red),
  orange: createPalette(baseColors.orange),
  amber: createPalette(baseColors.amber),
  yellow: createPalette(baseColors.yellow),
  lime: createPalette(baseColors.lime),
  green: createPalette(baseColors.green),
  teal: createPalette(baseColors.teal),
  sky: createPalette(baseColors.sky),
  blue: createPalette(baseColors.blue),
  indigo: createPalette(baseColors.indigo),
  purple: createPalette(baseColors.purple),
  fuschia: createPalette(baseColors.fuschia),
};

const apple90s = cubes.get("apple90s")!.cube;
const appleColorGenerator = (hue: number) => {
  const rgb = rybHsl2rgb([hue, 1, 0.5], { cube: apple90s });
  const toHex = (val: number) =>
    Math.round(val * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
};

export const appleColor = {
  red: appleColorGenerator((0 / 6) * 360),
  orange: appleColorGenerator((1 / 6) * 360),
  yellow: appleColorGenerator((2 / 6) * 360),
  green: appleColorGenerator((3 / 6) * 360),
  blue: appleColorGenerator((4 / 6) * 360),
  purple: appleColorGenerator((5 / 6) * 360),
};

export const white = "rgb(255, 244, 216)";
export const black = mix("rgb(20, 20, 20)", white, 0.3);

export const color6_old = [
  mix(appleColorGenerator((6 / 12) * 360), white, 0),
  // "  #ff77bc",
  // mix(appleColor((11 / 12) * 360), "#ffffff", 0.3),
  mix("#F49AC2", black, 0),
  mix(appleColorGenerator((4 / 12) * 360), white, 0),
  mix(appleColorGenerator((8 / 12) * 360), white, 0),
  mix(appleColorGenerator((10 / 12) * 360), white, 0),
  mix(appleColorGenerator((2 / 12) * 360), white, 0.2),
];
export const color6 = [color.blue[5], color.red[5], color.green[5], color.yellow[5], color.purple[5], color.fuschia[5]];

export const color10Order = ["blue", "yellow", "fuschia", "lime", "purple"];

export const color6_20250320 = [
  color[color10Order[0]][5],
  color[color10Order[1]][4],
  color[color10Order[4]][5],
  color.red[4],
  color[color10Order[3]][4],
  color[color10Order[2]][4],
];

/* OH NO!!!! I WANT TO START WITH A GREEN!!!!! NOT BLUE!!!! */

// color-blind friendly green
export const color6_20250320v2 = [
  // color[color10Order[0]][5],
  // mix(color.blue[5], color.white, 0.1),
  color.blue[5],
  // color[color10Order[1]][4], // this yellow may be too bright
  mix(color.yellow[5], color.white, 0.45),
  // color[color10Order[4]][5], // this purple may be too dark for scatterplots...
  mix(color.purple[5], color.white, 0.5),
  color.red[4],
  color.green[3],
  // color[color10Order[2]][4],
  mix(color.fuschia[5], color.white, 0.35),
  // mix(color.teal[4], color.blue[4], 0.8),
];

export const color6_20250323 = [
  // color[color10Order[0]][5],
  // mix(color.blue[5], color.white, 0.1),
  color.blue[5],
  // color[color10Order[1]][4], // this yellow may be too bright
  mix(color.yellow[5], color.white, 0.45),
  // color[color10Order[4]][5], // this purple may be too dark for scatterplots...
  color.red[4],
  mix(color.purple[5], color.white, 0.5),
  color.green[3],
  // color[color10Order[2]][4],
  mix(color.fuschia[5], color.white, 0.35),
  // mix(color.teal[4], color.blue[4], 0.8),
];
