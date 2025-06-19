import _, { Dictionary } from "lodash";

export function For<T, R>(
  data: T[] | Record<string, T> | _.Collection<T> | _.Object<Dictionary<T>>,
  callback: (d: T, i: number | string) => R
): R[] {
  // Unwrap lodash wrapper objects
  if (_.isObject(data) && typeof (data as any).value === "function") {
    data = (data as any).value();
  }
  if (Array.isArray(data)) {
    return data.map(callback);
  } else if (typeof data === "object" && data !== null) {
    return Object.entries(data).map(([key, value]) => callback(value as T, key));
  } else {
    return [];
  }
}
