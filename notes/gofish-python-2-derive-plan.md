# Plan: Implement derive operator round-trip for gofish-python-2 widget

## Goal

Enable `derive` operators in `gofish-python-2` to execute the user-provided Python lambda from the front-end widget using Arrow-based RPC, mirroring the working flow in `gofish-python`.

## Design summary

- Use the existing `lambdaId` emitted by `DeriveOperator` to identify Python callables.
- Carry a Python-side registry `{ lambdaId -> fn }` into the widget instance (not synced).
- Expose an `executeDerive` callable on the AnyWidget model that accepts `(lambdaId, arrowB64)` and returns the derived result as base64 Arrow IPC.
- In the ESM widget (`widget-src/index.ts`), map `derive` operators to a bridge that:
  1. Converts the current data slice to Arrow IPC.
  2. Base64-encodes and calls `model.get("executeDerive")`.
  3. Decodes the returned Arrow IPC to JS objects.
  4. Returns that value from the derive operator.

## Tasks (ordered)

1. **Audit & align with gofish-python reference**
   - Re-read `notes/python-wrapper-analysis.md` and `packages/gofish-python/gofish/widget.py` derive flow.
   - Confirm any helper functions we should mirror (Arrow conversions, debug hooks).

2. **Python IR & registry plumbing**
   - In `gofish/ast.py`:
     - Ensure `DeriveOperator` already emits `lambdaId` (it does); add method to expose `(lambdaId, fn)` for collection if needed.
   - In `ChartBuilder.render`:
     - Collect derive functions from `self.operators` into `{lambdaId: fn}`.
     - Pass this registry into `GoFishChartWidget` constructor.

3. **Widget traitlets & RPC hook**
   - In `gofish/widget.py` (python-2 version):
     - Add `derive_functions` traitlet (unsynced).
     - Add `executeDerive` traitlet default that:
       - Looks up `lambdaId` in `derive_functions`.
       - Decodes input Arrow base64 -> DataFrame (reuse `arrow_to_dataframe`).
       - Executes the callable; allow DataFrame or array-like result.
       - Encodes result back to Arrow base64 (reuse `dataframe_to_arrow`).
       - Logs debug info and raises clear errors if missing/failed.
     - Ensure the constructor stores the registry and binds `_esm`.

4. **Front-end derive bridge**
   - In `widget-src/index.ts`:
     - Add helper `arrayToArrow` (mirror from gofish-python JS) with int64→int32 cast handling.
     - Update `OPERATOR_MAP.derive` to:
       - Validate `lambdaId` and `executeDerive` presence on `model`.
       - Build `derive` operator that serializes `d` -> Arrow IPC -> base64, calls `executeDerive(lambdaId, arrowB64)`, decodes result back to objects, and returns it.
     - Ensure BigInt/number conversion mirrors `arrowTableToArray` behavior.
     - Add error handling that surfaces meaningful messages in debug.

5. **Docs & tests**
   - README: Remove/replace “derive not supported” note; add short usage example and behavior note.
   - Tests/Notebook: There is already a test in test_rendering.ipynb. The user will run this.

6. **Build & verify**
   - Rebuild widget bundle (`pnpm build:widget`) after front-end changes.
   - Run targeted Python tests (if feasible) or outline manual steps if env not ready.

## Risks / open questions

- Arrow schema casting: ensure Python result schema matches JS expectations; be explicit about int64 handling.
- Async timing with AnyWidget: confirm `executeDerive` is available before widget render; if not, add guard/retry.
- Data volume: arrow round-trips may be heavy; keep logging gated by `debug`.
