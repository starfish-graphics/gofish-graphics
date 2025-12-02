# GoFish Python: Motivation and Goals

## Why Create a Python Wrapper?

### The Problem

GoFish Graphics is a powerful TypeScript/JavaScript visualization library with a unique declarative API based on functional composition and coordinate transforms. However, the data science and scientific computing communities primarily work in Python:

- **Jupyter Notebooks** are the de facto standard for exploratory data analysis
- **pandas** and **numpy** provide rich data manipulation capabilities
- **Python's ecosystem** includes powerful libraries for statistics, machine learning, and scientific computing
- Most data practitioners are more comfortable with Python than JavaScript

While JavaScript has excellent visualization libraries (D3, Observable Plot, Vega-Lite), there's a gap: **how can Python users leverage GoFish's unique approach to visualization without leaving their Python environment?**

### The Goal

Create a Python interface to GoFish that:

1. **Feels Pythonic** - Uses familiar patterns (builder pattern, method chaining, pandas DataFrames)
2. **Maintains Fidelity** - Preserves the power and flexibility of the JavaScript API
3. **Enables Python-Side Logic** - Allows data transformations using Python's rich ecosystem
4. **Works in Jupyter** - Seamlessly integrates with JupyterLab, Jupyter Notebook, VSCode, and Google Colab
5. **Requires No Setup** - Works offline, behind firewalls, with no manual dependency management

### Non-Goals

This project intentionally **does not**:

- Reimplement GoFish's rendering engine in Python (use the JavaScript version)
- Support server-side rendering (client-side only, leverages browser performance)
- Create a completely new API (closely mirrors the JavaScript chart API)
- Support every JavaScript feature initially (focus on chart API first, expand later)

## What Environments Does It Support?

The gofish-python widget is built on AnyWidget, which should work in any Jupyter-compatible environment. However, **only VSCode notebooks have been tested so far**. Other Jupyter environments (JupyterLab, Jupyter Notebook, Google Colab, JupyterHub, etc.) may work but are untested.

### Non-Jupyter Environments (Not Supported)

#### Streamlit / Gradio / Dash

- **Status**: ❌ Not Supported
- **Why**: These frameworks have different rendering models (server-side state, custom components)

#### Python Scripts (Non-Interactive)

- **Status**: ❌ Not Supported
- **Why**: Widget requires Jupyter kernel + browser for rendering

## Architecture Decisions and Trade-offs

### Decision 1: Client-Side Rendering (Browser)

**Choice**: Render charts in the browser using JavaScript, not server-side in Python.

**Rationale**:

- Leverages existing GoFish JavaScript library (no rewrite needed)
- Better performance (GPU acceleration, efficient DOM updates)
- Reduced server load (rendering happens on client)
- Enables interactivity (hover, zoom, pan - future features)

**Trade-offs**:

- Requires browser environment (no command-line usage)
- Data must be transferred to browser (network overhead)
- Cannot use Python-only visualization features

**Alternatives Considered**:

- Server-side rendering with matplotlib-style API (would lose GoFish's unique features)
- Hybrid approach (some rendering server-side) (complex, no clear benefit)

### Decision 2: Apache Arrow for Data Transfer

**Choice**: Use Apache Arrow IPC format instead of JSON for data serialization.

**Rationale**:

- 3-5x smaller than JSON for numeric data
- Zero-copy deserialization in JavaScript (1000x faster)
- Type preservation (int vs float, null handling)
- Standard format (interoperability with other tools)

**Trade-offs**:

- Adds dependency (pyarrow, apache-arrow npm package)
- More complex than JSON (requires schema, type handling)
- base64 encoding adds 33% overhead (could use binary transport)

**Alternatives Considered**:

- JSON (simple but slow and large for big datasets)
- CSV (loses type information, still requires parsing)
- MessagePack/CBOR (better than JSON but not zero-copy)
- Parquet (too heavy, designed for storage not transport)

### Decision 3: AnyWidget for Jupyter Integration

**Choice**: Use AnyWidget instead of ipywidgets or custom solutions.

**Rationale**:

- Modern ESM support (clean imports, bundling)
- Simple API (just export a render function)
- Bidirectional communication (traitlets + commands)
- Wide compatibility (JupyterLab, Notebook, VSCode)
- Active development and good documentation

**Trade-offs**:

- Relatively new library (less mature than ipywidgets)
- Experimental features (e.g., commands) may change
- Smaller community (fewer examples and tutorials)

**Alternatives Considered**:

- ipywidgets (more mature but more complex setup, harder ESM support)
- IPython.display.HTML (no bidirectional communication, can't do derive)
- Jupyter Comms API directly (too low-level, would reinvent AnyWidget)

### Decision 4: RPC for Derive Operator

**Choice**: Execute derive lambdas in Python via RPC from JavaScript.

**Rationale**:

- Python lambdas cannot be serialized to JavaScript
- Derive must run in operator pipeline (can't pre-execute)
- Enables using pandas, numpy, sklearn, etc. for transformations
- Maintains semantic meaning (derive is a transformation step)

**Trade-offs**:

- Adds latency (50-200ms per derive call)
- Requires active Jupyter kernel (no static export with derive)
- Introduces async (GoFish chart API is currently synchronous)
- Complex error handling (errors can happen on either side)

**Alternatives Considered**:

- Pre-execute all derives in Python before sending (breaks pipeline semantics, loses reactivity)
- Translate Python to JavaScript (impossible in general case, limited subset would be too restrictive)
- Restrict derive to simple operations (too limiting, defeats purpose)
- Use WebAssembly Python (complex setup, poor pandas/numpy support, large bundle)

### Decision 5: Bundle All Dependencies

**Choice**: Bundle gofish-graphics, solid-js, and apache-arrow into a single widget file.

**Rationale**:

- Works offline and behind firewalls (no CDN access required)
- Consistent versions (no version conflicts with other widgets)
- Faster startup (single file, no module resolution)
- Simpler deployment (wheel includes everything)

**Trade-offs**:

- Larger bundle size (~2.2 MB minified)
- Longer initial load time (~100-300ms)
- Must rebuild bundle when dependencies change
- Cannot share dependencies with other widgets

**Alternatives Considered**:

- Use CDN (esm.sh, unpkg) (doesn't work offline, version conflicts, network latency)
- Import maps (complex, browser support varies, can fail mysteriously)
- External dependencies (require manual setup, bad UX)
