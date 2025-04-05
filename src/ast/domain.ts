import { Measure } from "./data";

export type Domain = ContinuousDomain | AestheticDomain;

export type ContinuousDomain = {
  type: "continuous";
  value: [number, number];
  measure: Measure;
};

export const continuous = ({ value, measure }: { value: [number, number]; measure: Measure }): ContinuousDomain => ({
  type: "continuous",
  value,
  measure,
});

export type AestheticDomain = {
  type: "aesthetic";
  value: any;
};

export const aesthetic = (value: any): AestheticDomain => ({
  type: "aesthetic",
  value,
});

export const canUnifyDomains = (domains: Domain[]) => {
  return domains.every((domain) => domain.type === "continuous" && domain.measure === domains[0].measure);
};

export const unifyContinuousDomains = (domains: ContinuousDomain[]) => {
  const measure = domains[0].measure;
  const mins = domains.map((domain) => domain.value[0]);
  const maxs = domains.map((domain) => domain.value[1]);
  return {
    measure,
    value: [Math.min(...mins), Math.max(...maxs)],
  };
};
