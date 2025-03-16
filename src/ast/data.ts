export type Value<T> = T | { type: "datum"; datum: any; dataTypeName: string | undefined };

export const value = <T>(datum: T, dataTypeName?: string): Value<T> => ({ type: "datum", datum, dataTypeName });

export const isDatum = <T>(value: Value<T>): value is { type: "datum"; datum: T; dataTypeName: string | undefined } => {
  return typeof value === "object" && value !== null && "type" in value && value.type === "datum";
};
