import type { Meta, StoryObj } from "@storybook/html";
import { initializeContainer } from "../helper";
import bottlePng from "../assets/maja7777-glass-bottle-free-2451180_1280.png";

const meta: Meta = {
  title: "Shapes/Compositing/Porter-Duff Atop + Luminosity",
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
};

export const Prototype: StoryObj<Args> = {
  args: {
    w: 696 / 2, h: 1280 / 2, splitY: 50, bgColor: "#1c7520"
  },
  render: (args: Args) => {
    const container = initializeContainer();
    container.innerHTML = "";

    const frame = document.createElement("div");
    frame.style.width = `${args.w}px`;
    frame.style.height = `${args.h}px`;
    // frame.style.border = "1px solid #d1d5db";
    // frame.style.background = "#ffffff";
    frame.style.overflow = "hidden";

    frame.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${args.w}" height="${args.h}" viewBox="0 0 ${args.w} ${args.h}" role="img" aria-label="Porter-Duff atop with luminosity blend prototype">
        <defs>
          <filter id="atopLuminosity" x="0" y="0" width="${args.w}" height="${args.h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="graySource"/>
            <feImage result="destination" href="data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${args.w}\" height=\"${args.h}\"><rect x=\"0\" y=\"${args.h - args.h * (args.splitY / 100)}\" width=\"${args.w}\" height=\"${args.h * (args.splitY / 100)}\" fill=\"${args.bgColor}\"/></svg>`
    )}"/>
            <feComposite in="destination" in2="graySource" operator="atop" result="atopResult"/>
            <feBlend in="atopResult" in2="graySource" mode="color"/>
          </filter>
        </defs>

        <image
          x="0"
          y="0"
          width="${args.w}"
          height="${args.h}"
          preserveAspectRatio="xMidYMid meet"
          href="${bottlePng}"
          filter="url(#atopLuminosity)"/>
      </svg>
    `;

    container.appendChild(frame);
    return container;
  },
};
