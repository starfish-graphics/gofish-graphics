import { GoFishNode } from "./_node";

/** Optional third argument: when provided by ChartBuilder.resolve(), named marks register each produced node/datum here. */
export type Mark<T> = (
  d: T,
  key?: string | number,
  layerContext?: { [name: string]: { data: any[]; nodes: GoFishNode[] } }
) => Promise<GoFishNode>;

export type Operator<T, U> = (_: Mark<U>) => Promise<Mark<T>>;
