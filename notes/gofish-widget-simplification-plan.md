Plan: Simplify the GoFish Python Widget and Fix the `solid-js` Dependency Error

Purpose

- Reduce widget complexity and remove fragile runtime dependency loading so the Jupyter widget is stable offline/behind firewalls.
- Eliminate the `Error loading dependencies: Failed to resolve module specifier "solid-js"` by bundling dependencies instead of relying on ad-hoc import maps and network fetches.
- Keep the Python package focused on IR + data marshaling, with a small, testable JS surface for rendering.

What’s Wrong Today (snapshot)

- `gofish/widget.py` builds a big `_esm` string at runtime, injects an import map that points to `https://esm.sh/solid-js` and `https://esm.sh/apache-arrow`, and then loads the local `gofish-graphics/dist/index.js` via a data URL. If import maps or outbound network are blocked, `solid-js` is unresolved (the error seen in the notebook).
- The JS runtime (`gofish/widget.js`) reconstructs operators/marks manually, performs a custom Arrow-to-array conversion, and contains a lot of logging and branching that make it hard to reason about failures.
- Python raises if `packages/gofish-graphics/dist/index.js` is missing, but the JS path still depends on remote deps. There is no packaged, versioned JS artifact inside the Python wheel, so widget behavior depends on the local repo layout.

Target Architecture (high-level)

- Single, self-contained ESM bundle for the widget that already includes `gofish-graphics`, `solid-js`, and `apache-arrow` (no import maps, no network requests). Bundle lives in the Python package as static data (e.g., `gofish/_static/widget.esm.js`).
- Tiny JS entry point (TypeScript if helpful) that:
  - Accepts `{ spec, arrowData, width, height, axes, debug }` from AnyWidget.
  - Converts Arrow IPC bytes → rows with a small helper (or uses Arrow’s Table.toArray once).
  - Maps the IR operators/mark to the GoFish API with a simple lookup table instead of a long series of `if` blocks.
  - Renders to the container and produces a concise error UI when rendering fails.
- Python `GoFishChartWidget` stops string-splicing JS. It just loads the packaged bundle text and passes widget state; no runtime import maps, no remote URLs.
- Build-time scripts produce the bundle from a source file (e.g., `packages/gofish-python-2/widget-src/index.ts`) using `esbuild` or `vite` with `bundle: true` and `platform: browser`. Solid + Arrow are not marked external so they’re baked in; `gofish-graphics` is pulled from either `packages/gofish-graphics` source or its `dist` build.
- Distribution: `pyproject.toml` / package data includes the built bundle. Installing from PyPI should work without the monorepo present.

Concrete Steps

1. Add a dedicated widget source folder
   - Create `packages/gofish-python-2/widget-src/index.ts` (or `.js`) as the only source of widget logic.
   - Define a minimal `render(model, el)` that calls a `renderChart` helper; keep operator/mark mapping in a small dictionary; keep Arrow conversion in one place.
   - Keep logging minimal and feature-flagged via `model.get("debug")`.

2. Build a self-contained browser bundle
   - Add a build script (e.g., `pnpm --filter gofish-python-2 build:widget`) that runs `esbuild` with `bundle: true`, `format: esm`, `platform: browser`, `target: es2019`, `sourcemap: inline`, and outputs to `gofish/_static/widget.esm.js`.
   - Input imports: `gofish-graphics` (prefer source if available, else `dist/index.js`), `solid-js`, `solid-js/web`, and `apache-arrow`. Do not mark these as externals; let the bundler include them to avoid runtime module resolution.
   - If size is a worry, allow optional splitting into two bundles (`widget.esm.js` + `arrow.worker.js`) but keep default as single-file for offline use.

3. Simplify Python integration
   - In `gofish/widget.py`, replace the string template machinery with: load `widget.esm.js` from package data, set `_esm=bundle_text`, and pass traitlet values. Keep the guard that ensures a local build of `gofish-graphics` exists at build time, not at render time.
   - Package data: include `gofish/_static/widget.esm.js` in `pyproject.toml` / `MANIFEST.in`. Wheel installs should work without the monorepo.
   - Keep `Arrow` serialization in Python (`dataframe_to_arrow`) and send only the base64 bytes + the IR spec to JS.

4. Clarify the JS IR contract
   - Document expected IR shape (operators, mark, options) in `README.md` or a new `docs/widget.md`. Note any defaults (e.g., `axes=false`, `debug=false`).

5. Error handling and UX
   - Provide a single error renderer that shows a short message and the stack when `debug` is true. Avoid inline styles if tests assert text equality.
   - Add a “missing bundle” check that surfaces a clear Python-side error if `widget.esm.js` is not found in the installed package.

6. Tests and checks
   - Add a lightweight JS unit test (e.g., vitest) for the operator/mark mapping and Arrow conversion helpers.
   - Add a Python smoke test that instantiates `GoFishChartWidget` with a tiny DataFrame and ensures `_esm` loads without hitting the network (mock `import` to confirm no `https://` fetches).
   - Optional: add a notebook-based golden image or text snapshot to `tests/test_rendering.ipynb` once the bundle is stable.

Dependency Error Fix (explicit)

- Root cause: the widget tries to load `solid-js` via an import map to `https://esm.sh/solid-js`, which fails in offline/locked-down environments or when the import map is not processed before the data-URL import.
- Remedy in this plan: bundle `solid-js` (and `apache-arrow`) directly into `widget.esm.js` at build time. The runtime no longer uses import maps or network URLs, so `import "solid-js"` never executes in the browser; it resolves to the bundled code.

Definition of Done

- Installing `gofish-python-2` wheel enables the widget with no network access and no repo-local paths.
- Rendering a simple chart in Jupyter shows no dependency resolution errors, even with network disabled.
- JS widget code lives in one small source file, and the Python side only loads the baked bundle.

Implementation TODO (sequenced)

1. Source setup

- Create `packages/gofish-python-2/widget-src/` with a single entry (index.ts/js) and stubs for Arrow conversion + operator/mark lookup tables.
- Wire a minimal `render(model, el)` that delegates to `renderChart` and surfaces errors via a shared helper.

2. Bundler setup

- Add a build script (pnpm/uv-friendly) that runs esbuild/vite with `bundle:true`, `platform:browser`, `format:esm`, targeting `gofish/_static/widget.esm.js`.
- Ensure inputs include `gofish-graphics`, `solid-js`, `solid-js/web`, and `apache-arrow` with nothing marked external.
- Commit the built artifact to the repo and package data.

3. Python integration

- Simplify `gofish/widget.py` to load `_esm` from `gofish/_static/widget.esm.js`; drop runtime import-map injection.
- Keep the local `gofish-graphics` build check at build/install time; surface a clear error if missing.
- Update package data in `pyproject.toml`/`MANIFEST.in` to ship the bundle.

4. Contract and docs

- Document the IR contract and default options in `README.md` or `docs/widget.md`.
- Note offline/air-gapped behavior and the absence of remote fetches.

5. Testing

- JS: add unit tests for operator/mark mapping and Arrow conversion helper.
- Python: add a smoke test that instantiates `GoFishChartWidget` and ensures no network fetches occur (mock to catch `https://`).
- Optional: add a minimal notebook snapshot test once rendering stabilizes.

6. Cleanup and polish

- Trim excessive logging; gate verbose logs behind `debug`.
- Verify error UI is concise and consistent; ensure missing-bundle errors are clear.
