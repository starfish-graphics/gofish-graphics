import { GoFishNode } from "./_node";
import { Token } from "./createName";

export type ScopeContext = Map<string, GoFishNode>;
export type TokenContext = Map<Token, GoFishNode>;

export const scopeContext = (initialContext: ScopeContext) => {
  return initialContext;
};

export const tokenContext = (initialContext: TokenContext) => {
  return initialContext;
};
