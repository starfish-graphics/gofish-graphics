// import { ContinuousDomain } from "./domain";
import { interval, Interval } from "../util/interval";

export type UnderlyingSpaceKind =
  | "position"
  | "interval"
  | "ordinal"
  | "undefined";

export type UnderlyingSpace = {
  kind: UnderlyingSpaceKind;
  spacing?: number;
  ordinalGroupId?: string;
  source?: string;
  domain?: Interval;
};

export const POSITION = (domain: [number, number]): UnderlyingSpace => ({
  kind: "position",
  domain: interval(domain[0], domain[1]),
});
export const INTERVAL: UnderlyingSpace = { kind: "interval" };
export const ORDINAL: UnderlyingSpace = { kind: "ordinal" };
export const UNDEFINED: UnderlyingSpace = { kind: "undefined" };
