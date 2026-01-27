declare module "fontkit" {
  export type Font = {
    unitsPerEm: number;
    ascent?: number;
    descent?: number;
    lineGap?: number;
    layout: (text: string) => {
      glyphs?: any[];
      positions?: any[];
    };
  };

  export function create(data: ArrayBuffer | Uint8Array): Font;
}
