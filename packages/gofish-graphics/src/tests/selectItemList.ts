import { LayerSelector, type LayerContext } from "../ast/marks/chart";

/**
 * Minimal runtime test to verify that LayerSelector.resolve implements
 * the “Option 3” behavior:
 *
 * - When a named layer node has datum = [row1, row2, ...],
 *   select("layer") should return an array
 *   [{ ...row1, __ref: node }, { ...row2, __ref: node }, ...].
 *
 * This file is not wired into an automated test runner; it’s intended
 * for ad‑hoc execution in a development environment.
 */
export const testSelectItemList = () => {
  // Fake node that looks like a GoFishNode for LayerSelector purposes.
  const fakeNode: any = {
    datum: [
      { lake: "Lake A", species: "Bass", count: 5 },
      { lake: "Lake A", species: "Trout", count: 3 },
      { lake: "Lake A", species: "Catfish", count: 2 },
    ],
  };

  const layerContext: LayerContext = {
    bars: {
      data: [],
      nodes: [fakeNode],
    },
  };

  const selector = new LayerSelector<any>("bars");
  const result = selector.resolve(layerContext);

  // Basic shape checks – Option 3 behavior.
  console.log("testSelectItemList result:", result);

  console.assert(
    Array.isArray(result),
    "select(\"bars\") should return an array"
  );
  console.assert(
    result.length === 3,
    `expected 3 items from flattened datum array, got ${result.length}`
  );
  console.assert(
    result.every((item) => item.__ref === fakeNode),
    "each flattened item should carry the duplicated __ref to the source node"
  );
  console.assert(
    result.map((d) => d.count).join(",") === "5,3,2",
    "flattened items should preserve original row fields"
  );

  return result;
};

