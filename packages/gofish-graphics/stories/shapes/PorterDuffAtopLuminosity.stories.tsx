import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import bottlePng from "../assets/wilsonblanco.png";

const meta: Meta = {
  title: "Shapes/Compositing/Porter-Duff Inspired",
  argTypes: {
    w: {
      control: { type: "number", min: 320, max: 1600, step: 10 },
    },
    h: {
      control: { type: "number", min: 180, max: 1000, step: 10 },
    },
  },
};

export default meta;

type Args = {
  w: number;
  h: number;
  splitY: number;
  bgColor: string;
  blendMode: "color" | "multiply" | "screen" | "overlay";
};

const DEFAULT_ARGS: Args = {
  w: 193,
  h: 678,
  splitY: 50,
  bgColor: "#1c7520",
  blendMode: "color",
};

function renderPorterDuff(args: Args, operator: "over" | "in" | "xor" | "out" | "atop", label: string) {
  const container = initializeContainer();
  container.innerHTML = "";

  const frame = document.createElement("div");
  frame.style.width = `${args.w}px`;
  frame.style.height = `${args.h}px`;
  frame.style.overflow = "hidden";

  const splitY = args.h - args.h * (args.splitY / 100);
  const splitH = args.h * (args.splitY / 100);
  const uid = `pd-${Math.random().toString(36).slice(2, 10)}`;
  const tail =
    operator === "in"
      ? `<feBlend in="compositeResult" in2="graySource" mode="${args.blendMode}" result="blendedIntersect"/>
         <feComposite in="blendedIntersect" in2="compositeResult" operator="in"/>`
      : operator === "over" || operator === "atop"
        ? `<feBlend in="compositeResult" in2="graySource" mode="${args.blendMode}"/>`
        : "";

  frame.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${args.w}" height="${args.h}" viewBox="0 0 ${args.w} ${args.h}" role="img" aria-label="${label}">
      <defs>
        <image id="${uid}-source" x="0" y="0" width="${args.w}" height="${args.h}" preserveAspectRatio="xMidYMid meet" href="${bottlePng}"/>
        <rect id="${uid}-destination" x="0" y="${splitY}" width="${args.w}" height="${splitH}" fill="${args.bgColor}"/>
        <filter id="${uid}-filter" x="0" y="0" width="${args.w}" height="${args.h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feImage href="#${uid}-source" result="sourceImage"/>
          <feColorMatrix in="sourceImage" type="saturate" values="0" result="graySource"/>
          <feImage href="#${uid}-destination" result="destination"/>
          <feComposite in="destination" in2="graySource" operator="${operator}" result="compositeResult"/>
          ${tail}
        </filter>
        <g id="${uid}-scene">
          <rect x="0" y="0" width="${args.w}" height="${args.h}" fill="transparent" filter="url(#${uid}-filter)"/>
        </g>
      </defs>

      <use href="#${uid}-scene"/>
    </svg>
  `;

  container.appendChild(frame);
  return container;
}

function renderMask(args: Args) {
  const container = initializeContainer();
  container.innerHTML = "";

  const frame = document.createElement("div");
  frame.style.width = `${args.w}px`;
  frame.style.height = `${args.h}px`;
  frame.style.overflow = "hidden";

  const splitY = args.h - args.h * (args.splitY / 100);
  const splitH = args.h * (args.splitY / 100);
  const uid = `mask-${Math.random().toString(36).slice(2, 10)}`;

  frame.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${args.w}" height="${args.h}" viewBox="0 0 ${args.w} ${args.h}" role="img" aria-label="Mask (none)">
      <defs>
        <image id="${uid}-source" x="0" y="0" width="${args.w}" height="${args.h}" preserveAspectRatio="xMidYMid meet" href="${bottlePng}"/>
        <rect id="${uid}-destination" x="0" y="${splitY}" width="${args.w}" height="${splitH}" fill="${args.bgColor}"/>
        <mask id="${uid}-bottleMask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
          <use href="#${uid}-source"/>
        </mask>
        <g id="${uid}-scene">
          <use href="#${uid}-destination" mask="url(#${uid}-bottleMask)"/>
        </g>
      </defs>

      <use href="#${uid}-scene"/>
    </svg>
  `;

  container.appendChild(frame);
  return container;
}

export const Union: StoryObj<Args> = {
  name: "Union (over)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderPorterDuff(args, "over", "Union (over)"),
};

export const Intersect: StoryObj<Args> = {
  name: "Intersect (in)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderPorterDuff(args, "in", "Intersect (in)"),
};

export const Exclude: StoryObj<Args> = {
  name: "Exclude (xor)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderPorterDuff(args, "xor", "Exclude (xor)"),
};

export const Subtract: StoryObj<Args> = {
  name: "Subtract (out)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderPorterDuff(args, "out", "Subtract (out)"),
};

export const Paint: StoryObj<Args> = {
  name: "Paint (atop)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderPorterDuff(args, "atop", "Paint (atop)"),
};

export const Mask: StoryObj<Args> = {
  name: "Mask (none)",
  args: DEFAULT_ARGS,
  render: (args: Args) => renderMask(args),
};
