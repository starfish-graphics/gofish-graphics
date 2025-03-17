export type Domain = ContinuousDomain | AestheticDomain;

export type ContinuousDomain = {
  type: "continuous";
  value: [number, number];
  dataType: string;
};

export const continuous = ({ value, dataType }: { value: [number, number]; dataType: string }): ContinuousDomain => ({
  type: "continuous",
  value,
  dataType,
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
  return domains.every((domain) => domain.type === "continuous" && domain.dataType === domains[0].dataType);
};

export const unifyContinuousDomains = (domains: ContinuousDomain[]) => {
  const dataType = domains[0].dataType;
  const mins = domains.map((domain) => domain.value[0]);
  const maxs = domains.map((domain) => domain.value[1]);
  return {
    dataType,
    value: [Math.min(...mins), Math.max(...maxs)],
  };
};
