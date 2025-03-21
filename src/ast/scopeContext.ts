import { GoFishNode } from "./_node";

export type ScopeContext = Map<string, GoFishNode>;

export const scopeContext = (initialContext: ScopeContext) => {
  return initialContext;
};
