// import { ContinuousDomain } from "./domain";
import { interval, Interval } from "../util/interval";

export type UnderlyingSpaceKind =
  | "position"
  | "interval"
  | "ordinal"
  | "undefined";

export type POSITION_TYPE = {
  kind: "position";
  domain: Interval;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
};

export type INTERVAL_TYPE = {
  kind: "interval";
  width: number;
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
  | INTERVAL_TYPE
  | ORDINAL_TYPE
  | UNDEFINED_TYPE;

export const POSITION = (domain: [number, number]): UnderlyingSpace => ({
  kind: "position",
  domain: interval(domain[0], domain[1]),
});

export const isPOSITION = (space: UnderlyingSpace): space is POSITION_TYPE =>
  space.kind === "position";

export const INTERVAL = (width: number): UnderlyingSpace => ({
  kind: "interval",
  width,
});
export const isINTERVAL = (space: UnderlyingSpace): space is INTERVAL_TYPE =>
  space.kind === "interval";

export const ORDINAL: UnderlyingSpace = { kind: "ordinal" };
export const isORDINAL = (space: UnderlyingSpace): space is ORDINAL_TYPE =>
  space.kind === "ordinal";

export const UNDEFINED: UnderlyingSpace = { kind: "undefined" };
export const isUNDEFINED = (space: UnderlyingSpace): space is UNDEFINED_TYPE =>
  space.kind === "undefined";
