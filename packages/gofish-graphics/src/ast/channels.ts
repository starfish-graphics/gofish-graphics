import { sumBy } from "lodash";
import { isValue, MaybeValue, value } from "./data";

export type ChannelType = "size" | "color";

export type ChannelAnnotations<T> = {
  [K in keyof T]?: ChannelType;
};

export type AccessorFn<T extends Record<string, any>, V> = (d: T[]) => V;

export type ResolvableProp<T extends Record<string, any>, V> =
  | V
  | (keyof T & string)
  | AccessorFn<T, V | (keyof T & string)>;

/**
 * Derive mark prop types from shape prop types + channel annotations.
 *
 * - "size" channels: mark accepts shape value, string field shorthand, or accessor fn
 * - "color" channels: mark accepts shape value, string field shorthand, or accessor fn
 * - unannotated props: passed through or accessor fn
 */
export type DeriveMarkProps<
  ShapeProps,
  Channels extends ChannelAnnotations<ShapeProps>,
  T extends Record<string, any>,
> = {
  [K in keyof ShapeProps]: K extends keyof Channels
    ? Channels[K] extends "size"
      ? ResolvableProp<T, ShapeProps[K]>
      : Channels[K] extends "color"
        ? ResolvableProp<T, ShapeProps[K]>
        : ShapeProps[K] | AccessorFn<T, ShapeProps[K]>
    : ShapeProps[K] | AccessorFn<T, ShapeProps[K]>;
} & { debug?: boolean };

/**
 * Infer a size value from a field name or literal number.
 * If accessor is a string (field name), sums the field across the data array.
 * If accessor is a number, passes it through as a literal.
 */
export const inferSize = <T>(
  accessor: string | number | MaybeValue<number> | undefined,
  d: T | T[],
): MaybeValue<number> | undefined => {
  if (isValue(accessor as MaybeValue<number>)) {
    return accessor as MaybeValue<number>;
  }
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
  accessor: string | MaybeValue<string> | undefined,
  data: T[],
): MaybeValue<string> | undefined => {
  if (isValue(accessor)) return accessor;
  if (accessor === undefined) return undefined;
  if (data.length > 0 && accessor in data[0]) {
    return value(data[0][accessor]);
  }
  return accessor;
};
