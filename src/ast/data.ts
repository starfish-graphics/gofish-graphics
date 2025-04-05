import { Interval } from "./dims";

export type Measure = string;

export const measure = (unit: string): Measure => unit;

export type Value<T> = T | { type: "datum"; datum: any; measure?: Measure };
export type MaybeValue<T> = T | Value<T>;

export const value = <T>(datum: T, measure?: Measure): Value<any> => ({ type: "datum", datum, measure });

export const isValue = <T>(value: MaybeValue<T>): value is Value<T> => {
  return typeof value === "object" && value !== null && "type" in value && value.type === "datum";
};

export const getValue = <T>(value: MaybeValue<T>): T => {
  if (isValue(value)) {
    return value.datum;
  }
  return value;
};

export const getMeasure = <T>(value: MaybeValue<T>): Measure => {
  if (isValue(value)) {
    return value.measure ?? "unknown";
  }
  return "unknown";
};

export const inferEmbedded = <T>(interval: Interval<T>): Interval<T> => {
  // size must be a value && min must be undefined, aesthetic, or a value of the same type as size
  if (
    isValue(interval.size) &&
    (interval.min === undefined || !isValue(interval.min) || getMeasure(interval.min) === getMeasure(interval.size))
  ) {
    return { ...interval, embedded: true };
  }
  return interval;
};
