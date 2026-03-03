import { ChartBuilder } from "../lib";
import { GoFishAST } from "./_ast";
import { GoFishNode } from "./_node";

/** Optional third argument: when provided by ChartBuilder.resolve(), named marks register each produced node/datum here. */
export type Mark<T> = (
  d: T | undefined,
  key?: string | number,
  layerContext?: { [name: string]: { data: any[]; nodes: GoFishNode[] } }
) => GoFishAST | Promise<GoFishAST>
    | (() => GoFishAST | Promise<GoFishAST>)
    | ChartBuilder<any, any>;

export type Operator<T, U> = (_: Mark<U>) => Promise<Mark<T>>;
