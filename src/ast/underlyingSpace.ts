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
};

export const POSITION: UnderlyingSpace = { kind: "position" };
export const INTERVAL: UnderlyingSpace = { kind: "interval" };
export const ORDINAL: UnderlyingSpace = { kind: "ordinal" };
export const UNDEFINED: UnderlyingSpace = { kind: "undefined" };
