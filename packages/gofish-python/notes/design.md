# GoFish Python: Design

## Why Create a Python Wrapper?

### The Problem

GoFish Graphics is a powerful TypeScript/JavaScript visualization library with a unique declarative API based on functional composition and coordinate transforms. However, the data science and scientific computing communities primarily work in Python:

- **Jupyter Notebooks** are the de facto standard for exploratory data analysis
- **pandas** and **numpy** provide rich data manipulation capabilities
- **Python's ecosystem** includes powerful libraries for statistics, machine learning, and scientific computing
- Most data practitioners are more comfortable with Python than JavaScript

So how can Python users leverage GoFish's unique approach to visualization without leaving their
Python environment? GoFish doesn't really take advantage of any unique JS syntax features, so it
should be possible to implement a Python API that is close to the JavaScript API.

### The Goal

Create a Python interface to GoFish that:

1. **Feels Pythonic** - Uses familiar patterns (builder pattern, method chaining, pandas DataFrames)
2. **Corresponds Closely to the JavaScript API** - Preserves the power and flexibility of the JavaScript API
3. **Enables Python-Side Logic** - Allows data transformations in Python, not just in JavaScript.
4. **Works in Jupyter** - Seamlessly integrates with JupyterLab, Jupyter Notebook, VSCode, Google
   Colab, and Marimo.
5. **Doesn't Require Internet or a Special Setup. Just `pip install`** - Works offline, behind firewalls, with no manual dependency management

### Non-Goals

This project intentionally **does not**:

- Reimplement GoFish's rendering engine in Python
- Support server-side rendering (client-side only for now)
- Create a completely new API (closely mirrors the JavaScript chart API)
- Support every JavaScript feature initially (focus on chart API first, expand later)

**Just to make it super clear: We're only supporting the mid-level chart API for now. The low-level API is not supported yet.**

## What Environments Does It Support?

The gofish-python widget is built on AnyWidget, which should work in any Jupyter-compatible environment. However, **only VSCode notebooks have been tested so far**. Other Jupyter environments (JupyterLab, Jupyter Notebook, Google Colab, JupyterHub, etc.) may work but are untested.

### Non-Jupyter Environments (Not Supported)

#### Streamlit / Gradio / Dash

- **Status**: ❌ Not Supported
- **Why**: These frameworks have different rendering models (server-side state, custom components).
  Haven't explored it too deeply yet.

#### Python Scripts (Non-Interactive)

- **Status**: ❌ Not Supported
- **Why**: Widget requires Jupyter kernel + browser for rendering

## Architecture Decisions and Trade-offs

### Decision 1: Client-Side Rendering (Browser)

**Choice**: Render charts in the browser using JavaScript, not server-side in Python.

**Rationale**:

- Leverages existing GoFish JavaScript library (no rewrite needed)
- Enables interactivity (hover, zoom, pan - future features)

**Trade-offs**:

- Requires browser environment (makes it harder to build for non-notebook environments, but this has
  been solved by other Python visualization libraries already)
- Data must be marshalled between Python and JavaScript

**Alternatives Considered**:

- Python-only API (would require effectively maintaining two separate codebases with parallel logic.
  likely to introduce bugs)

### Decision 2: Apache Arrow for Data Transfer

**Choice**: Use Apache Arrow IPC format instead of JSON for data serialization.

**Rationale**:

- Mostly I find JSON icky for representing tabular data. (It's pretty good for tree-shaped
  qualitative-ish things like specs, though.)
- Set the stage for possibly integrating Mosaic later.
- Possibly avoid JSON semantic weirdnesses.
- Use an efficient, zero-copy format for data transfer.

**Trade-offs**:

- Adds dependency (pyarrow, apache-arrow npm package)
- More complex than JSON (requires schema, type handling)

**Alternatives Considered**:

- JSON (simple but slow and large for big datasets)

### Decision 3: AnyWidget for Jupyter Integration

**Choice**: Use AnyWidget instead of ipywidgets or custom solutions.

**Rationale**:

- Modern ESM support (clean imports, bundling)
- Simple API (just export a render function)
- Bidirectional communication (traitlets + commands)
- Wide compatibility (JupyterLab, Notebook, VSCode)
- Active development and good documentation

**Trade-offs**:

- Reliance on experimental `command` API.
- Doesn't work outside notebook environments.

**Alternatives Considered**:

- ipywidgets (more mature but more complex setup, harder ESM support)
- IPython.display.HTML (no bidirectional communication, can't do derive)
- Jupyter Comms API directly (too low-level, would reinvent AnyWidget)

### Decision 4: RPC for Derive Operator

**Choice**: Execute derive lambdas in Python via RPC from JavaScript.

**Rationale**:

- Python lambdas cannot be serialized to JavaScript
- Derive must run in operator pipeline (can't pre-execute)
- Enables using pandas, numpy, sklearn, etc. for transformations. Not restricted to eg a data transformation sublanguage like Vega-Lite's.

**Trade-offs**:

- Introduces async into GoFish JS, which significantly increases complexity in many parts of the codebase.

**Alternatives Considered**:

- Pre-execute all derives in Python before sending (breaks pipeline semantics, loses reactivity)
- Translate Python to JavaScript (impossible in general case, limited subset would be too restrictive)
- Use WebAssembly Python (complex setup, poor pandas/numpy support, large bundle)

### Decision 5: Bundle All Dependencies

**Choice**: Bundle gofish-graphics, solid-js, and apache-arrow into a single widget file.

**Rationale**:

- Works offline and behind firewalls (no CDN access required)
- Consistent versions (no version conflicts with other widgets)
- Faster startup (single file, no module resolution)
- Simpler deployment (wheel includes everything)

**Trade-offs**:

- Larger bundle size

**Alternatives Considered**:

- Use CDN (esm.sh, unpkg) (doesn't work offline, version conflicts, network latency)
- Import maps (complex, browser support varies, can fail mysteriously)
- External dependencies (require manual setup, bad UX)
