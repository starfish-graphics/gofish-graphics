import { sumBy, meanBy } from "lodash";
import { MaybeValue, Value, value } from "./data";

export type ChannelType = "size" | "pos" | "color" | "raw";

export type ChannelAnnotations<T> = {
  [K in keyof T]?: ChannelType;
};

/**
 * Derive mark prop types from shape prop types + channel annotations.
 *
 * - "size" channels: mark accepts `number | keyof T | Value<number>` instead of `MaybeValue<number>`
 * - "color" channels: mark accepts `string | keyof T | Value<string>` instead of `MaybeValue<string>`
 * - unannotated props: passed through with the same type
 */
export type DeriveMarkProps<
  ShapeProps,
  Channels extends ChannelAnnotations<ShapeProps>,
  T extends Record<string, any>,
> = {
  [K in keyof ShapeProps]: K extends keyof Channels
    ? Channels[K] extends "size"
      ? number | (keyof T & string) | Value<number> | undefined
      : Channels[K] extends "pos"
        ? number | (keyof T & string) | Value<number> | undefined
        : Channels[K] extends "color"
          ? string | (keyof T & string) | Value<string> | undefined
          : Channels[K] extends "raw"
            ?
                | string
                | number
                | (keyof T & string)
                | Value<string | number>
                | undefined
            : ShapeProps[K]
    : ShapeProps[K];
} & { debug?: boolean };

/**
 * Infer a size value from a field name or literal number.
 * If accessor is a string (field name), sums the field across the data array.
 * If accessor is a number, passes it through as a literal.
 */
export const inferSize = <T>(
  accessor: string | number | undefined,
  d: T | T[]
): MaybeValue<number> | undefined => {
  return typeof accessor === "number"
    ? accessor
    : accessor !== undefined
      ? value(sumBy(d as T[], accessor))
      : undefined;
};

/**
 * Infer a position value from a field name or literal number.
 * If accessor is a string (field name), averages the field across the data array.
 * If accessor is a number, passes it through as a literal.
 */
export const inferPos = <T>(
  accessor: string | number | undefined,
  d: T | T[]
): MaybeValue<number> | undefined => {
  return typeof accessor === "number"
    ? accessor
    : accessor !== undefined
      ? value(meanBy(Array.isArray(d) ? d : [d], accessor))
      : undefined;
};

/**
 * Infer a color value from a field name or literal string.
 * If the string matches a field in the first data item, wraps it as a Value.
 * Otherwise passes through as a literal color string.
 */
export const inferColor = <T extends Record<string, any>>(
  accessor: string | undefined,
  data: T[]
): MaybeValue<string> | undefined => {
  if (accessor === undefined) return undefined;
  if (data.length > 0 && data[0] != null && accessor in data[0]) {
    return value(data[0][accessor]);
  }
  return accessor;
};

/**
 * Infer a raw scalar value from a field name or literal string/number.
 * If the string matches a field in the first data item, wraps it as a Value.
 * Otherwise passes through as-is (literal string or number).
 * No aggregation — suitable for text content, labels, unscaled identifiers.
 */
export const inferRaw = <T extends Record<string, any>>(
  accessor: string | number | undefined,
  data: T[]
): MaybeValue<string | number> | undefined => {
  if (accessor === undefined) return undefined;
  if (typeof accessor === "number") return accessor;
  if (data.length > 0 && data[0] != null && accessor in data[0]) {
    return value(data[0][accessor]);
  }
  return accessor;
};
