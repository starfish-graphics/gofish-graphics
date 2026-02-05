import { sumBy } from "lodash";
import { MaybeValue, value } from "./data";

export type ChannelType = "size" | "color";

export type ChannelAnnotations<T> = {
  [K in keyof T]?: ChannelType;
};

/**
 * Derive mark prop types from shape prop types + channel annotations.
 *
 * - "size" channels: mark accepts `number | keyof T` instead of `MaybeValue<number>`
 * - "color" channels: mark accepts `string | keyof T` instead of `MaybeValue<string>`
 * - unannotated props: passed through with the same type
 */
export type DeriveMarkProps<
  ShapeProps,
  Channels extends ChannelAnnotations<ShapeProps>,
  T extends Record<string, any>,
> = {
  [K in keyof ShapeProps]: K extends keyof Channels
    ? Channels[K] extends "size"
      ? number | (keyof T & string) | undefined
      : Channels[K] extends "color"
        ? string | (keyof T & string) | undefined
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
  d: T | T[],
): MaybeValue<number> | undefined => {
  return typeof accessor === "number"
    ? accessor
    : accessor !== undefined
      ? value(sumBy(d as T[], accessor))
      : undefined;
};

/**
 * Infer a color value from a field name or literal string.
 * If the string matches a field in the first data item, wraps it as a Value.
 * Otherwise passes through as a literal color string.
 */
export const inferColor = <T extends Record<string, any>>(
  accessor: string | undefined,
  data: T[],
): MaybeValue<string> | undefined => {
  if (accessor === undefined) return undefined;
  if (data.length > 0 && accessor in data[0]) {
    return value(data[0][accessor]);
  }
  return accessor;
};
