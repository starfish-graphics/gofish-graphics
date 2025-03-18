/* https://github.com/rvanwijnen/spectral.js/issues/16#issuecomment-2494702669 */
declare module "spectral.js" {
  // Format constants
  export const RGB: 0;
  export const RGBA: 1;
  export const HEX: 2;
  export const HEXA: 3;

  // Configuration constants
  export const SIZE: 38;
  export const GAMMA: 2.4;
  export const EPSILON: 0.00000001;

  // Refractive index constants
  export const RI: 1.0;
  export const K1: number;
  export const K2: 0;

  // Spectral data arrays
  export const SPD_C: number[];
  export const SPD_M: number[];
  export const SPD_Y: number[];
  export const SPD_R: number[];
  export const SPD_G: number[];
  export const SPD_B: number[];

  export const CIE_CMF_X: number[];
  export const CIE_CMF_Y: number[];
  export const CIE_CMF_Z: number[];
  export const XYZ_RGB: number[][];

  // Type definitions
  type ColorFormat = typeof RGB | typeof RGBA | typeof HEX | typeof HEXA;
  type ColorArray = [number, number, number] | [number, number, number, number];
  type ColorInput = ColorArray | string;

  // Core color mixing functions
  export function linear_to_concentration(l1: number, l2: number, t: number): number;
  export function mix(color1: ColorInput, color2: ColorInput, t: number, returnFormat?: ColorFormat): string;
  export function palette(color1: ColorInput, color2: ColorInput, size: number, returnFormat?: ColorFormat): string[];

  // Color space conversion functions
  export function uncompand(x: number): number;
  export function compand(x: number): number;
  export function srgb_to_linear(srgb: number[]): number[];
  export function linear_to_srgb(lrgb: number[]): number[];
  export function xyz_to_srgb(xyz: number[]): number[];
  export function reflectance_to_xyz(R: number[]): number[];

  // Spectral conversion functions
  export function spectral_upsampling(lrgb: number[]): [number, number, number, number, number, number, number];
  export function linear_to_reflectance(lrgb: number[]): number[];

  // Utility functions
  export function lerp(a: number, b: number, alpha: number): number;
  export function clamp(value: number, min: number, max: number): number;
  export function dotproduct(a: number[], b: number[]): number;
  export function glsl_color(c: ColorInput): [number, number, number, number];
  export function unpack(color: ColorInput): [number, number, number, number];
  export function pack(srgb: number[], returnFormat: ColorFormat): string;

  // GLSL shader code
  export function glsl(): string;
}
