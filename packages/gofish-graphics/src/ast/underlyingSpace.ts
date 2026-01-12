// import { ContinuousDomain } from "./domain";
import { interval, Interval } from "../util/interval";

export type UnderlyingSpaceKind =
  | "position"
  | "difference"
  | "size"
  | "ordinal"
  | "undefined";

export type POSITION_TYPE = {
  kind: "position";
  domain: Interval;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
};

export type DIFFERENCE_TYPE = {
  kind: "difference";
  width: number;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
};

export type SIZE_TYPE = {
  kind: "size";
  value: number;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
};

export type ORDINAL_TYPE = {
  kind: "ordinal";
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
};

export type UNDEFINED_TYPE = {
  kind: "undefined";
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
};

export type UnderlyingSpace =
  | POSITION_TYPE
  | DIFFERENCE_TYPE
  | SIZE_TYPE
  | ORDINAL_TYPE
  | UNDEFINED_TYPE;

export const POSITION = (domain: Interval): UnderlyingSpace => ({
  kind: "position",
  domain,
});

export const isPOSITION = (space: UnderlyingSpace): space is POSITION_TYPE =>
  space.kind === "position";

export const DIFFERENCE = (width: number): UnderlyingSpace => ({
  kind: "difference",
  width,
});
export const isDIFFERENCE = (
  space: UnderlyingSpace
): space is DIFFERENCE_TYPE => space.kind === "difference";

export const SIZE = (value: number): UnderlyingSpace => ({
  kind: "size",
  value,
});
export const isSIZE = (space: UnderlyingSpace): space is SIZE_TYPE =>
  space.kind === "size";

export const ORDINAL: UnderlyingSpace = { kind: "ordinal" };
export const isORDINAL = (space: UnderlyingSpace): space is ORDINAL_TYPE =>
  space.kind === "ordinal";

export const UNDEFINED: UnderlyingSpace = { kind: "undefined" };
export const isUNDEFINED = (space: UnderlyingSpace): space is UNDEFINED_TYPE =>
  space.kind === "undefined";
