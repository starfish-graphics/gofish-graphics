import _, { Dictionary, List, ValueIteratee } from "lodash";

// /**
//  * Groups a collection by a key and maps over each group.
//  * @param collection The collection to group.
//  * @param iteratee The iteratee to group by (string or function).
//  * @param mapFn The function to map over each group (items, key) => result.
//  * @returns An array of mapped results, one per group.
//  */
// export function groupBy<T, K extends string | number, R>(
//   collection: T[] | Record<string, T>,
//   iteratee: ((item: T) => K) | keyof T,
//   mapFn: (items: T[], key: string) => R
// ): R[] {
//   const grouped = _.groupBy(collection, iteratee as any);
//   return Object.entries(grouped).map(([key, items]) => mapFn(items, key));
// }

// export function groupBy<T>(collection: List<T> | null | undefined, iteratee?: ValueIteratee<T>): Array<[string, T[]]>;
// export function groupBy<T extends object>(
//   collection: T | null | undefined,
//   iteratee?: ValueIteratee<T[keyof T]>
// ): Array<[string, Array<T[keyof T]>]>;
// export function groupBy(collection: any, iteratee: any) {
//   return Object.entries(_.groupBy(collection, iteratee));
// }

export const groupBy = _.groupBy;
