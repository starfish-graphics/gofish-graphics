export type Value<T> = T | { type: "datum"; datum: any; dataType: string | undefined };
export type MaybeValue<T> = T | Value<T>;

export const value = <T>(datum: T, dataType?: string): Value<T> => ({ type: "datum", datum, dataType });

export const isValue = <T>(value: MaybeValue<T>): value is Value<T> => {
  return typeof value === "object" && value !== null && "type" in value && value.type === "datum";
};

export const getValue = <T>(value: MaybeValue<T>): T => {
  if (isValue(value)) {
    return value.datum;
  }
  return value;
};

export const getDataType = <T>(value: MaybeValue<T>): string => {
  if (isValue(value)) {
    return value.dataType ?? "unknown";
  }
  return "unknown";
};
