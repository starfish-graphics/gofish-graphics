const noSnapshots = (files) =>
  files.filter((f) => !f.includes("__snapshots__") && !f.includes("tests/tmp"));

export default {
  "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}": (files) => {
    const f = noSnapshots(files);
    if (!f.length) return [];
    return [
      `pnpm exec eslint --fix ${f.join(" ")}`,
      `pnpm exec prettier --write ${f.join(" ")}`,
    ];
  },
  "*.{json,yml,yaml,md,css,html,vue}": (files) => {
    const f = noSnapshots(files);
    if (!f.length) return [];
    return [`pnpm exec prettier --write ${f.join(" ")}`];
  },
};
