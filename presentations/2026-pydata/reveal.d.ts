declare module "reveal.js" {
  interface RevealOptions {
    hash?: boolean;
    transition?: string;
    width?: number;
    height?: number;
    margin?: number;
    plugins?: unknown[];
    highlight?: Record<string, unknown>;
    [key: string]: unknown;
  }

  class Reveal {
    constructor(options?: RevealOptions);
    initialize(options?: RevealOptions): Promise<void>;
    on(event: string, handler: () => void): void;
    off(event: string, handler: () => void): void;
    getCurrentSlide(): HTMLElement | null;
    slide(h: number, v?: number, f?: number): void;
    next(): void;
    prev(): void;
  }

  export default Reveal;
}

declare module "reveal.js/plugin/highlight/highlight" {
  const RevealHighlight: unknown;
  export default RevealHighlight;
}

declare module "reveal.js/dist/reveal.css" {}
declare module "reveal.js/dist/theme/white.css" {}
declare module "./hljs-github-light.css" {}
