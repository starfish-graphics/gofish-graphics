# GoFish Python Wrapper: Deep Analysis and Refactoring Guide

## Executive Summary

The Python wrapper for GoFish Graphics enables Python users (primarily in Jupyter notebooks) to create visualizations using a fluent API that mirrors the JavaScript chart API. The wrapper converts Python code into an intermediate representation (IR) that is sent to JavaScript for rendering. Apache Arrow handles efficient data marshaling, and anywidget orchestrates the Python-JavaScript interop in Jupyter environments. The key challenge is handling Python lambdas in `derive()` operators, which requires RPC calls from JavaScript back to Python during the rendering pipeline.

## Essential Goal and Purpose

The Python wrapper aims to provide a **Pythonic interface to GoFish Graphics** while maintaining maximum fidelity to the JavaScript API syntax. Users should be able to write code like:

```python
chart(data).flow(spread("x"), derive(lambda d: d.sort_values("y"))).mark(rect(h="y"))
```

And have it render identically to the JavaScript equivalent. The wrapper must:

1. **Translate Python API calls to an IR** that JavaScript can reconstruct
2. **Marshal data efficiently** using Apache Arrow (not JSON)
3. **Execute Python lambdas** in `derive()` operators via RPC during the JS rendering pipeline
4. **Support Jupyter environments** with interactive rendering (client-side)
5. **Eventually support low-level APIs** (v1 and v2) in addition to the chart API

## Current Architecture

### Python Side Structure

The Python implementation is organized into:

- **`chart.py`**: Core `ChartBuilder` class with fluent API (`flow()`, `mark()`, `render()`)
- **`operators.py`**: Operator classes (`spread`, `stack`, `derive`, `group`, `scatter`)
- **`marks.py`**: Mark classes (`rect`, `circle`, `line`, `area`, `scaffold`)
- **`widget.py`**: `GoFishChartWidget` (anywidget subclass) for Jupyter rendering
- **`arrow_utils.py`**: Arrow serialization/deserialization helpers
- **`bridge.py`**: Standalone HTML rendering (for non-Jupyter use)
- **`render.py`**: Rendering dispatcher (chooses widget vs HTML based on environment)

### JavaScript Side Structure

- **`client-render.js`**: Client-side bundle that imports GoFish and Arrow
- **`vite.config.js`**: Builds the client bundle as both ESM and IIFE
- **Vite bundles** `gofish-graphics`, `apache-arrow`, and `solid-js` into a single file

### Data Flow

1. **Python**: User creates chart with `chart(df).flow(...).mark(...).render()`
2. **Python**: Chart spec (operators, mark, options) is serialized to JSON
3. **Python**: DataFrame is converted to Arrow IPC bytes, then base64-encoded
4. **Python**: Widget is created with spec + Arrow data + derive function registry
5. **JavaScript**: Widget ESM code loads the bundled client (GoFish + Arrow + SolidJS)
6. **JavaScript**: Reconstructs operators and mark from the spec
7. **JavaScript**: For `derive` operators, creates SolidJS `createResource` for async RPC
8. **JavaScript**: Renders chart, calling back to Python when derive functions execute
9. **Python**: `executeDerive` traitlet method runs the lambda and returns Arrow bytes

### Intermediate Representation (IR)

The current IR is a **simple JSON structure**:

```json
{
  "data": null,
  "operators": [
    {"type": "spread", "field": "lake", "dir": "x", "spacing": 8},
    {"type": "derive", "lambdaId": "uuid-here"},
    {"type": "stack", "field": "species", "dir": "y"}
  ],
  "mark": {"type": "rect", "h": "count", "fill": "species"},
  "options": {}
}
```

**Key observations:**
- Data is NOT in the IR (sent separately via Arrow)
- Operators have a `type` field and their options as flat key-value pairs
- `derive` operators store a `lambdaId` that maps to a Python function in the widget
- Marks similarly have a `type` and their options
- This structure is **tightly coupled to the chart API** and doesn't generalize to low-level APIs

## What's Necessary vs. Unnecessary

### Essential Components

1. **`chart.py`**: Core builder pattern - **KEEP**
2. **`operators.py`**: Operator definitions with `to_dict()` - **KEEP** but simplify
3. **`marks.py`**: Mark definitions with `to_dict()` - **KEEP** but simplify
4. **`arrow_utils.py`**: Arrow conversion - **KEEP** (critical for performance)
5. **`widget.py`**: anywidget integration - **KEEP** (only Jupyter solution that works)
6. **`render.py`**: Environment detection - **KEEP** but simplify

### Potentially Unnecessary or Overcomplicated

1. **`bridge.py` (490 lines)**:
   - Contains complex Node.js detection, dependency installation, bundle building
   - Most of this is **unnecessary in production** - bundles should be pre-built
   - The HTML rendering function could be simplified to just load a pre-built bundle
   - **Recommendation**: Simplify to a ~50 line file that loads pre-built assets

2. **Separate `render.py` dispatcher**:
   - Currently just chooses between widget and bridge
   - Could be merged into `chart.py` as a `_render_impl()` method
   - **Recommendation**: Consider merging or keeping if you expect more rendering backends

3. **Complex operator base classes**:
   - `Operator` base class is simple but could be even simpler
   - `DeriveOperator` stores source code (unused) and has `execute()` method (never called on operator itself)
   - **Recommendation**: Remove unused features, keep just `to_dict()`

4. **Multiple test files in `tests/`**:
   - Four different test/widget files suggesting experimental iteration
   - **Recommendation**: Clean up to one canonical example per use case

## Simplification Opportunities

### 1. Pre-Build All JavaScript Assets

**Current problem**: `bridge.py` tries to build bundles on-the-fly with npm/vite.

**Better approach**:
- Build the client bundle during package build/installation
- Ship the pre-built `gofish-client.js` and `gofish-client.iife.js` with the Python package
- Remove all the Node.js/npm detection and installation code
- Just load the pre-built bundle from the package data directory

### 2. Unify Operator and Mark Representations

**Current problem**: Separate `Operator` and `Mark` classes with similar `to_dict()` patterns.

**Better approach**:
- Create a single `Node` or `Spec` class that represents any IR node
- Both operators and marks become instances of this class
- Reduces code duplication and makes IR more uniform

### 3. Simplify Widget ESM Code

**Current problem**: The ESM code in `widget.py` is 420+ lines of inline JavaScript with complex error handling and debug logging.

**Better approach**:
- Move the ESM code to a separate `.js` file in the package
- Load it at widget initialization time
- Makes it easier to test, debug, and maintain
- Or, use the pre-built client bundle directly as a data URL is already done

### 4. Remove Unused Features

- Remove `_source` storage in `DeriveOperator` (unused)
- Remove the standalone HTML rendering mode if Jupyter-only is acceptable
- Remove the `execute()` method on `DeriveOperator` (execution happens via widget traitlet)

## Async/Await Requirements for gofish-graphics

### The Core Issue

The `derive` operator in Python executes a Python lambda, but this happens **in the middle of the operator flow** in JavaScript. The JS side must:

1. Start building the chart tree
2. Encounter a `derive` operator
3. **Stop and wait** for Python to execute the lambda
4. Get the result back from Python
5. Continue with the modified data

This requires **async/await throughout the gofish-graphics rendering pipeline**.

### Current State of gofish-graphics

Looking at `packages/gofish-graphics/src/ast/marks/chart.ts`, the current implementation is **entirely synchronous**:

```typescript
export function derive<T, U>(fn: (d: T) => U): Operator<T, U> {
  return (mark: Mark<U>) => {
    return (d: T, key?: string | number) => mark(fn(d), key);
  };
}
```

The `derive` function immediately calls `fn(d)` and expects a synchronous result.

### Required Changes to gofish-graphics

To support Python RPCs, the chart API needs to become async:

#### Option 1: Make Operators Async (Simpler)

```typescript
// Change the Operator type to return Promise<Mark>
export type Operator<T, U> = (_: Mark<U>) => Mark<T>;
// becomes:
export type Operator<T, U> = (_: Mark<U>) => AsyncMark<T>;
type AsyncMark<T> = (d: T, key?: string | number) => GoFishNode | Promise<GoFishNode>;

export function derive<T, U>(fn: (d: T) => U | Promise<U>): Operator<T, U> {
  return (mark: Mark<U>) => {
    return async (d: T, key?: string | number) => {
      const result = await fn(d); // fn can now be async
      return mark(result, key);
    };
  };
}
```

Then in `ChartBuilder.mark()`:

```typescript
async mark(mark: Mark<TOutput>): Promise<GoFishNode> {
  let finalMark = mark as Mark<any>;
  // ... apply operators ...

  // Need to handle async marks
  const result = finalMark(data as any);
  const node = result instanceof Promise ? await result : result;

  return Frame(this.options ?? {}, [node.setShared([true, true])]);
}
```

#### Option 2: Use SolidJS Resources (Current Approach)

The current widget implementation uses `createResource` from SolidJS to handle async data:

```javascript
reconstructedOp = derive((d) => {
  const [result] = createResource(
    () => [lambdaId, JSON.stringify(d)],
    async ([id, key]) => await executeDeriveViaModel(model, id, d)
  );

  // Return a resource accessor
  return () => result();
});
```

This approach **doesn't require changing gofish-graphics** because:
- The derive function returns a **thunk** (accessor function) instead of the data directly
- SolidJS's reactive system automatically waits for the resource to load
- The chart re-renders when the data becomes available

**Problem with this approach:**
- It ties the chart rendering to SolidJS's reactive system
- It won't work for the standalone HTML rendering mode
- It's somewhat "magical" and hard to debug

#### Option 3: Hybrid Approach (Recommended)

1. **Keep synchronous API for pure JavaScript use** (no changes to existing code)
2. **Add an async variant** for Python wrapper use:
   - Add `async chartAsync()` and `async mark()` variants
   - These accept `Promise<T>` for derive operators
   - Internally use `await` at each operator boundary

3. **In the Python wrapper**, use the async API:
   - Generate IR that specifies async mode
   - JS reconstructs operators to return Promises for derive
   - Use the `chartAsync` builder instead of `chart`

This preserves backward compatibility while enabling Python integration.

### Practical Implementation Steps

1. **Add async support to chart.ts**:
   - Create `chartAsync<T>()` function that returns `AsyncChartBuilder<T>`
   - `AsyncChartBuilder` has async `mark()` and `flow()` methods
   - Operators can return `Promise<GoFishNode>`

2. **Modify client-render.js** (or the widget ESM):
   - Check if spec has `async: true` flag
   - Use `chartAsync` instead of `chart` when flag is set
   - Await the result before rendering

3. **Minimal changes to existing gofish-graphics**:
   - Existing synchronous API remains unchanged
   - Async API is opt-in via separate functions
   - Most code is shared between sync and async paths

### Example Async API

```typescript
// In gofish-graphics/src/ast/marks/chart.ts

export class AsyncChartBuilder<TInput, TOutput = TInput> {
  async mark(mark: Mark<TOutput>): Promise<GoFishNode> {
    let finalMark = mark as Mark<any>;

    for (const op of this.operators.toReversed()) {
      finalMark = op(finalMark);
    }

    // Apply mark with await
    const result = finalMark(this.data as any);
    const node = result instanceof Promise ? await result : result;

    return Frame(this.options ?? {}, [node.setShared([true, true])]);
  }
}

export function chartAsync<T>(data: T, options?: ChartOptions): AsyncChartBuilder<T> {
  return new AsyncChartBuilder(data, options);
}
```

Then in widget ESM:

```javascript
// For derive operators, make the mark function async
if (op.type === "derive") {
  reconstructedOp = derive(async (d) => {
    return await executeDeriveViaModel(model, op.lambdaId, d);
  });
}

// Use async chart builder
const chartBuilder = chartAsync(data, spec.options);
const node = await chartBuilder.flow(...reconstructedOps).mark(reconstructedMark);
node.render(container, renderOptions);
```

## Anywidget vs Alternatives

### Why Anywidget?

Anywidget is the **best choice** for the Python wrapper because:

1. **Native Jupyter support** with zero configuration
2. **Client-side rendering** (JavaScript runs in browser, not kernel)
3. **Bidirectional communication** via traitlets (perfect for RPC)
4. **ESM support** allowing modern JavaScript imports
5. **Wide compatibility** (JupyterLab, Jupyter Notebook, VSCode, Google Colab)
6. **Active maintenance** and good documentation

### Alternatives Considered

#### 1. ipywidgets
- **Pros**: Official Jupyter widget framework, widely used
- **Cons**: More complex setup, harder to do custom JS, less ergonomic for modern ESM
- **Verdict**: Anywidget is a better developer experience

#### 2. IPython.display.HTML + inline JavaScript
- **Pros**: Simple, no dependencies
- **Cons**: No bidirectional communication (can't do RPC for derive), no reactivity
- **Verdict**: Can't support derive operators

#### 3. Jupyter Comms API (direct)
- **Pros**: Low-level control
- **Cons**: Much more complex to implement, reinventing anywidget
- **Verdict**: Not worth the effort

#### 4. Panel/HoloViz
- **Pros**: Rich interactive features
- **Cons**: Heavy dependency, different paradigm, harder to do custom rendering
- **Verdict**: Overkill for this use case

#### 5. Streamlit/Gradio
- **Pros**: Easy app building
- **Cons**: Not Jupyter-native, requires separate server
- **Verdict**: Wrong use case (for apps, not notebooks)

### Verdict: Stick with Anywidget

Anywidget is the right choice. The current implementation is sound - the complexity comes from the derive RPC mechanism, not from anywidget itself.

## Designing an Extensible IR

### Current IR Limitations

The current IR is **flat and operator-specific**:

```json
{"type": "spread", "field": "lake", "dir": "x", "spacing": 8}
```

**Problems:**
1. **No nesting**: Can't represent low-level API trees (e.g., `Stack([Rect(...), Rect(...)])`)
2. **String-based types**: Brittle, no type safety
3. **Flat options**: Can't distinguish between operator config vs data
4. **Not extensible**: Hard to add custom operators without modifying Python code

### Proposed IR Design: S-Expression Style

Use a **Lisp-like S-expression structure** that mirrors the AST directly:

```json
{
  "type": "operator",
  "name": "spread",
  "options": {"field": "lake", "dir": "x", "spacing": 8},
  "children": [
    {
      "type": "operator",
      "name": "derive",
      "options": {"lambdaId": "uuid-123"},
      "children": [
        {
          "type": "mark",
          "name": "rect",
          "options": {"h": "count", "fill": "species"}
        }
      ]
    }
  ]
}
```

**Benefits:**
- **Hierarchical**: Naturally represents nested operators
- **Uniform**: Same structure for operators, marks, and shapes
- **Extensible**: Easy to add custom nodes
- **Composable**: Can represent both chart API and low-level API

### Alternative: Arrow-Based IR

Since we're already using Arrow for data, why not use Arrow for the IR too?

**Idea**: Store the IR as an Arrow table with a schema like:

```
node_id: int64
parent_id: int64 (null for root)
type: string ("operator", "mark", "shape")
name: string ("spread", "rect", etc.)
options: string (JSON-encoded options)
```

**Benefits:**
- Consistent serialization format
- Efficient binary encoding
- Type safety from Arrow schema
- Could store data references inline

**Drawbacks:**
- More complex to implement
- Harder to debug (binary format)
- Overkill for small IRs

**Verdict**: JSON S-expressions are better for IRs, Arrow for data.

### Operator Registry for Extensibility

To support custom operators, implement a **registry pattern**:

```python
# In Python
class OperatorRegistry:
    _registry = {}

    @classmethod
    def register(cls, name: str, operator_class: Type[Operator]):
        cls._registry[name] = operator_class

    @classmethod
    def create(cls, name: str, **kwargs) -> Operator:
        return cls._registry[name](**kwargs)

# Users can register custom operators
@OperatorRegistry.register("custom_transform")
class CustomTransform(Operator):
    def to_dict(self):
        return {"type": "custom_transform", "param": self.param}
```

```javascript
// In JavaScript
const operatorRegistry = {
  spread: (opts) => spread(opts.field, opts),
  stack: (opts) => stack(opts.field, opts),
  custom_transform: (opts) => customTransform(opts),
};

// Reconstruct from IR
function reconstructOperator(spec) {
  const factory = operatorRegistry[spec.type];
  if (!factory) throw new Error(`Unknown operator: ${spec.type}`);
  return factory(spec.options);
}
```

This enables users to:
1. Write custom operators in JavaScript
2. Register them on both Python and JS sides
3. Use them seamlessly in the Python API

## Chart API vs Low-Level APIs

### Current State

The Python wrapper **only exposes the chart API** (v3):

```python
chart(data).flow(spread("x"), stack("y")).mark(rect(h="count"))
```

The low-level APIs (v1 and v2) are not available:

```javascript
// JavaScript v2 API (not available in Python yet)
StackX({ spacing: 2 }, [
  Rect({ w: 32, h: v(sumBy(d, "count")) })
])
```

### Why Low-Level APIs Matter

The chart API is **limited** because:
1. **Fixed structure**: Assumes data flows through operators to a single mark
2. **No custom composition**: Can't build complex nested visualizations
3. **Less control**: Operators have predetermined behaviors

The low-level APIs allow:
1. **Arbitrary composition** of shapes and operators
2. **Multiple marks** in a single visualization
3. **Precise control** over layout and positioning

### Challenges for Python Low-Level APIs

#### Challenge 1: The `For` Component

JavaScript `For` is a **function** that iterates and creates children:

```javascript
For(groupBy(data, "species"), (items, key) =>
  Rect({ h: v(sumBy(items, "count")) })
)
```

In Python, we need to decide:
1. **Keep `For` as a special component?**
   - Serialize it in the IR as `{"type": "For", "iterableId": "uuid", "children": [...]}`
   - JavaScript reconstructs it by calling `For(iterable, (d, k) => reconstructChild(spec, d, k))`
   - **Problem**: The child template is static, can't use Python lambdas

2. **Execute `For` eagerly in Python?**
   - Python evaluates `For` and generates children immediately
   - Send the expanded children list in the IR
   - **Problem**: Loses the semantic meaning (for labels, keys, etc.)

3. **Replace `For` with Python list comprehensions?**
   - Users write `[Rect(h=sum(items["count"])) for items in groups]`
   - **Problem**: Doesn't work with operators that expect `For` structure

**Recommendation**: Keep `For` as a special operator that:
- Accepts an iterable field name (like operators do)
- Accepts a child template in the IR
- JavaScript reconstructs it properly

```python
StackX(spacing=2, children=[
  For("species", Rect(h="count"))
])
```

Serializes to:

```json
{
  "type": "StackX",
  "options": {"spacing": 2},
  "children": [
    {
      "type": "For",
      "field": "species",
      "child": {"type": "Rect", "options": {"h": "count"}}
    }
  ]
}
```

#### Challenge 2: Value Accessors

JavaScript uses `v()` to mark data accessors:

```javascript
Rect({ h: v(sumBy(data, "count")) })
```

In Python, we need to distinguish between:
- Literal values: `Rect(h=100)`
- Field accessors: `Rect(h="count")`
- Computed values: `Rect(h=sum(data["count"]))`

**Recommendation**: Use type hints and smart serialization:

```python
# Python API
Rect(h="count")  # String = field accessor
Rect(h=100)      # Number = literal
Rect(h=lambda d: sum(d["count"]))  # Function = not supported (use derive)

# In IR
{"h": {"$field": "count"}}
{"h": 100}
```

JavaScript reconstructs:

```javascript
const h = spec.h.$field ? v(data[0][spec.h.$field]) : spec.h;
```

#### Challenge 3: Nested Operator Trees

The chart API is a **linear pipeline**:

```python
chart(data).flow(op1, op2, op3).mark(rect())
```

The low-level API is a **tree**:

```python
StackX([
  StackY([Rect(), Rect()]),
  StackY([Rect(), Rect()])
])
```

The IR must support tree structures. This requires:
1. **Operators take children** (already in S-expression IR proposal)
2. **Recursive reconstruction** in JavaScript
3. **Depth-first traversal** in Python serialization

### Proposed Python Low-Level API

```python
from gofish import StackX, StackY, Rect, v

# Define a tree structure
tree = StackX(
    spacing=2,
    children=[
        Rect(w=32, h=v("count")),
        StackY(
            spacing=1,
            children=[
                Rect(w=16, h=10),
                Rect(w=16, h=20),
            ]
        )
    ]
)

# Render it
tree.render(data, container, w=800, h=600)
```

Serialization:

```python
def to_dict(self):
    return {
        "type": self.__class__.__name__,
        "options": self.options,
        "children": [child.to_dict() for child in self.children]
    }
```

This is **much simpler** than the chart API! The complexity was in making the fluent pipeline work.

## Data Marshaling Strategy

### Why Apache Arrow?

Arrow is **essential** for:
1. **Zero-copy transfer**: No serialization overhead for large datasets
2. **Type preservation**: Maintains int vs float vs string types
3. **Standard format**: Works across Python, JavaScript, R, etc.
4. **Compressed**: More efficient than JSON for tabular data

### Current Arrow Usage

```python
# Python (arrow_utils.py)
def dataframe_to_arrow(df: pd.DataFrame) -> bytes:
    table = pa.Table.from_pandas(df)
    # Converts Int64 to Int32 to avoid BigInt issues in JS
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, table.schema) as writer:
        writer.write_table(table)
    return sink.getvalue().to_pybytes()
```

```javascript
// JavaScript (client-render.js)
const arrowBuffer = Uint8Array.from(atob(arrowData), c => c.charCodeAt(0));
const table = Arrow.tableFromIPC(arrowBuffer);
const data = arrowTableToArray(table);
```

### Improvements

1. **Avoid base64 encoding**:
   - Current implementation base64-encodes Arrow bytes for JSON transport
   - **Better**: Use binary websockets or binary traitlets (anywidget supports this)
   - **Saves**: ~33% overhead from base64 encoding

2. **Stream large datasets**:
   - For multi-GB datasets, don't load everything into memory
   - Use Arrow streaming format (already used, but could chunk more)
   - Send data in batches as it's needed

3. **Cache Arrow serialization**:
   - If the same DataFrame is rendered multiple times, cache the Arrow bytes
   - Add a `_arrow_cache` dict keyed by DataFrame id

4. **Type hints for Arrow schema**:
   - Generate Arrow schema from pandas dtype
   - Explicit schema is more robust than inferred schema

### Handling derive() with Arrow

The tricky part: derive functions transform DataFrames, so we need to:
1. **JavaScript → Python**: Send Arrow bytes of current data
2. **Python**: Deserialize, apply lambda, serialize result
3. **Python → JavaScript**: Send Arrow bytes of result

Current implementation does this correctly:

```python
# widget.py
def _execute_derive(self):
    def execute(lambda_id: str, arrow_data_b64: str) -> str:
        arrow_bytes = base64.b64decode(arrow_data_b64)
        df = arrow_to_dataframe(arrow_bytes)
        result_df = self.derive_functions[lambda_id](df)
        result_arrow = dataframe_to_arrow(result_df)
        return base64.b64encode(result_arrow).decode('utf-8')
    return execute
```

**Potential optimization**: Use binary traitlets to avoid base64 overhead.

## Recommendations Summary

### High Priority (Clean Up Now)

1. **Simplify `bridge.py`**:
   - Remove Node.js detection, npm install, bundle building
   - Pre-build bundles during package build
   - Reduce to ~50 lines that just load pre-built assets

2. **Clean up test files**:
   - Remove experimental widget test files
   - Keep one canonical example notebook

3. **Remove unused features**:
   - Remove `_source` storage in `DeriveOperator`
   - Remove `execute()` method on operators (never called)
   - Consider removing standalone HTML mode if Jupyter-only is OK

4. **Document the IR format**:
   - Add clear docstrings showing IR structure
   - Add examples of serialization for each operator/mark

### Medium Priority (Plan For)

1. **Add async support to gofish-graphics**:
   - Create `chartAsync()` and `AsyncChartBuilder`
   - Support `async` marks and operators
   - Update Python wrapper to use async API

2. **Improve IR design**:
   - Move to S-expression tree structure
   - Support hierarchical operators
   - Add operator registry for extensibility

3. **Expose low-level APIs**:
   - Add Python classes for `StackX`, `StackY`, `Rect`, etc.
   - Implement tree serialization
   - Handle `For` component properly

### Low Priority (Future Work)

1. **Optimize Arrow marshaling**:
   - Use binary traitlets instead of base64
   - Add Arrow byte caching
   - Stream large datasets in chunks

2. **Add more operators and marks**:
   - All operators from the JS API
   - Custom operator registry
   - Support for textures, filters, etc.

3. **Improve error messages**:
   - Better debugging for derive failures
   - Show Python tracebacks in JS console
   - Validate IR structure before sending

## Architecture Decision Records

### ADR 1: Use Anywidget for Jupyter Integration

**Decision**: Use anywidget as the Jupyter widget framework.

**Rationale**:
- Best developer experience for custom JavaScript
- Native bidirectional communication via traitlets
- ESM support for modern JavaScript
- Wide Jupyter compatibility

**Alternatives Considered**: ipywidgets (too complex), IPython.display.HTML (no RPC), Jupyter Comms (reinventing the wheel)

**Status**: Accepted ✅

### ADR 2: Marshal Data with Apache Arrow

**Decision**: Use Apache Arrow IPC format for data transfer between Python and JavaScript.

**Rationale**:
- Zero-copy deserialization in JavaScript
- Type preservation (int vs float vs string)
- Much more efficient than JSON for large datasets
- Standard format with wide tooling support

**Alternatives Considered**: JSON (too slow, type loss), CSV (type loss), Parquet (more complex)

**Status**: Accepted ✅

### ADR 3: RPC Pattern for derive() Operators

**Decision**: Execute Python derive lambdas via RPC from JavaScript to Python during rendering.

**Rationale**:
- Lambdas must run in Python (can't serialize Python code to JS)
- Must run *during* the operator pipeline (can't pre-execute)
- Anywidget traitlets provide RPC mechanism

**Alternatives Considered**:
- Pre-execute all derives in Python (breaks operator pipeline)
- Translate Python lambdas to JS (impossible in general case)
- Restrict derive to simple operations (too limiting)

**Status**: Accepted ✅ (but requires async support in gofish-graphics)

### ADR 4: Pre-Build JavaScript Bundles

**Decision**: Build client JavaScript bundles during package build, not at runtime.

**Rationale**:
- Users shouldn't need Node.js installed
- Faster startup (no build step)
- More reliable (no build failures at runtime)
- Standard practice for Python packages with JS components

**Alternatives Considered**:
- Build at runtime (current approach - too complex)
- Require users to build manually (bad UX)

**Status**: Proposed 📋 (needs implementation)

### ADR 5: S-Expression IR for Extensibility

**Decision**: Use tree-structured S-expression-like IR instead of flat operator list.

**Rationale**:
- Supports low-level API tree structures
- Naturally hierarchical
- Easy to extend with custom operators
- Mirrors AST structure

**Alternatives Considered**:
- Flat operator list (current - doesn't support trees)
- Arrow-based IR (overkill, harder to debug)

**Status**: Proposed 📋 (needs implementation)

## Open Questions

1. **Should we support standalone HTML rendering?**
   - Pro: Useful for sharing static visualizations
   - Con: Can't support derive() operators without Python
   - **Recommendation**: Keep for now, document limitations

2. **Should For be a special case or a regular component?**
   - Special case: Easier to implement, matches JS semantics
   - Regular component: More Pythonic, but harder to reconstruct in JS
   - **Recommendation**: Keep as special operator with IR support

3. **How to handle async rendering in SolidJS?**
   - Current approach uses createResource (works but is magical)
   - Could make gofish-graphics async (cleaner but more invasive)
   - **Recommendation**: Implement async chart API in gofish-graphics

4. **Should we bundle SolidJS or use Jupyter's copy?**
   - Bundle: More reliable, larger file size
   - Use Jupyter's: Smaller, but may have version conflicts
   - **Current**: Bundled (seems fine)

5. **How to handle errors in derive() functions?**
   - Should they crash the chart or show partial results?
   - How to display Python tracebacks in JS console?
   - **Recommendation**: Crash with clear error message including traceback

## Conclusion

The Python wrapper is fundamentally well-designed but has accumulated complexity from experimentation. The core architecture (anywidget + Arrow + IR) is sound. The main areas for cleanup are:

1. **Simplify bridge.py** by pre-building bundles
2. **Add async support** to gofish-graphics for cleaner derive handling
3. **Improve IR design** to support low-level APIs
4. **Remove unused code** and test files

The derive operator RPC mechanism is the most complex part, but it's necessary and the current approach (anywidget traitlets) is the right one. The main improvement would be making gofish-graphics natively async rather than relying on SolidJS resources.

The wrapper is ready for production use once bridge.py is simplified. Low-level API support can be added incrementally without breaking the chart API.
