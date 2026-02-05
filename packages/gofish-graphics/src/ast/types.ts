import { GoFishNode } from "./_node";

export type Mark<T> = (d: T, key?: string | number) => Promise<GoFishNode>;

export type Operator<T, U> = (_: Mark<U>) => Promise<Mark<T>>;
