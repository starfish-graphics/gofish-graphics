# GoFish Python Architecture

## Design Principles

### JavaScript as Source of Truth

**Key Principle**: JavaScript is the source of truth for all rendering, layout, and reactivity. Python provides an API wrapper that translates Python calls to JavaScript execution.

This follows the same pattern as:
- **Plotly**: Python API → JavaScript rendering
- **Bokeh**: Python API → JavaScript rendering
- **Altair**: Python API → Vega-Lite (JavaScript) rendering

### Why JavaScript?

1. **SolidJS Reactivity**: All animations and interactivity use SolidJS signals
2. **DOM Rendering**: Browser DOM manipulation requires JavaScript
3. **Performance**: JavaScript rendering is optimized for browsers
4. **Feature Parity**: Exact feature match with JavaScript GoFish
5. **Maintenance**: Single source of truth (JS implementation)

## Architecture Overview

```
┌─────────────────┐
│  Python Code    │  chart(data).flow(spread(...)).mark(rect(...))
└────────┬────────┘
         │
         │ Translate to JS calls
         ▼
┌─────────────────┐
│  Python Wrapper │  ChartBuilder, Operator, Mark classes
└────────┬────────┘
         │
         │ Bridge (PythonMonkey/JSPyBridge)
         ▼
┌─────────────────┐
│  JavaScript     │  chart(data).flow(spread(...)).mark(rect(...))
└────────┬────────┘
         │
         │ SolidJS rendering
         ▼
┌─────────────────┐
│  DOM/SVG        │  Interactive, animated graphics
└─────────────────┘
```

## Component Structure

### 1. JavaScript Bridge (`js_bridge.py`)

**Purpose**: Manages JavaScript runtime and loads GoFish library.

**Responsibilities**:
- Initialize JavaScript runtime (PythonMonkey or JSPyBridge)
- Locate and load GoFish JavaScript bundle
- Provide singleton access to GoFish module
- Handle bridge-specific differences

**Key Classes**:
- `JSBridge`: Singleton that manages JS runtime
- `get_gofish()`: Get GoFish JS module

### 2. Python Wrapper (`wrapper.py`)

**Purpose**: Mirrors JavaScript ChartBuilder API.

**Responsibilities**:
- Convert Python data to JavaScript
- Translate Python API calls to JS
- Chain operators and marks
- Return Python-wrapped GoFishNode

**Key Classes**:
- `ChartBuilder`: Wraps JS ChartBuilder
- `chart()`: Entry point function

### 3. Operators (`operators.py`)

**Purpose**: Python wrappers for GoFish operators.

**Responsibilities**:
- Create Python callable operators
- Convert Python options to JS
- Wrap Python functions for `derive()` operator
- Return JS-compatible operator objects

**Key Functions**:
- `spread()`, `stack()`, `scatter()`, `group()`
- `derive()`, `normalize()`, `repeat()`, `log()`

### 4. Marks (`marks.py`)

**Purpose**: Python wrappers for GoFish marks (shapes).

**Responsibilities**:
- Create Python callable marks
- Convert Python options to JS
- Return JS-compatible mark functions

**Key Functions**:
- `rect()`, `circle()`, `line()`, `area()`, `scaffold()`
- `select()`: Select data from layers

### 5. Node (`node.py`)

**Purpose**: Python wrapper for GoFish GoFishNode.

**Responsibilities**:
- Wrap JS GoFishNode instance
- Provide Python API for rendering
- Handle layer naming

**Key Classes**:
- `GoFishNode`: Wraps JS GoFishNode

### 6. Rendering (`render.py`)

**Purpose**: Handle chart rendering to different outputs.

**Responsibilities**:
- Render to DOM (web/Jupyter)
- Generate HTML strings
- Handle Jupyter notebook display
- Convert Python render options to JS

**Key Functions**:
- `render()`: Main rendering function
- `display_html()`: Generate HTML
- `display_jupyter()`: Display in Jupyter

### 7. Utilities (`utils.py`)

**Purpose**: Data conversion between Python and JavaScript.

**Responsibilities**:
- Convert Python types to JS (dict, list, numpy, pandas)
- Convert JS types to Python (for callbacks)
- Handle options conversion

**Key Functions**:
- `to_js()`: Python → JavaScript
- `from_js()`: JavaScript → Python
- `convert_options()`: Convert options dict

### 8. Events (`events.py`)

**Purpose**: Handle event callbacks (future work).

**Responsibilities**:
- Wrap Python callbacks for JS events
- Convert JS events to Python dicts
- Handle event types (click, hover, etc.)

**Status**: Design specification, not yet implemented.

## Data Flow

### Creating a Chart

1. **Python**: `chart(data)` creates `ChartBuilder`
2. **Python → JS**: Data converted to JS, `chart()` called in JS
3. **JS**: Returns JS ChartBuilder instance
4. **Python**: Wraps JS instance in Python `ChartBuilder`

### Adding Operators

1. **Python**: `.flow(spread("x", dir="x"))`
2. **Python → JS**: Operator converted to JS operator
3. **JS**: `.flow()` called on JS ChartBuilder
4. **JS**: Returns new JS ChartBuilder with operator
5. **Python**: Wraps in new Python `ChartBuilder`

### Applying Marks

1. **Python**: `.mark(rect(h="y"))`
2. **Python → JS**: Mark converted to JS mark function
3. **JS**: `.mark()` called, builds GoFishNode AST
4. **JS**: Returns JS GoFishNode
5. **Python**: Wraps in Python `GoFishNode`

### Rendering

1. **Python**: `.render(w=500, h=300)`
2. **Python → JS**: Options converted, container located/created
3. **JS**: SolidJS renders chart to DOM
4. **JS**: Returns container element
5. **Python**: Returns container (or HTML for Jupyter)

## JavaScript Bridge Options

### PythonMonkey

**Pros**:
- Embeds SpiderMonkey in Python
- No separate Node.js process
- Direct function calls
- Good for desktop/Jupyter

**Cons**:
- Requires native compilation
- May not support all Node.js APIs

### JSPyBridge

**Pros**:
- Bridges to full Node.js
- All Node.js APIs available
- Good for web servers

**Cons**:
- Requires Node.js installation
- Separate process (IPC overhead)
- More setup complexity

## Error Handling

### Common Issues

1. **Missing JS Bridge**: Install `pythonmonkey` or `jsbridge`
2. **Missing GoFish Bundle**: Build GoFish or set `GOFISH_JS_PATH`
3. **Data Conversion Errors**: Check data types match JS expectations
4. **Render Errors**: Check container exists and is accessible

## Future Enhancements

1. **Event Handling**: Complete event system implementation
2. **Animation Control**: Python API for triggering animations
3. **Signal Integration**: Python access to SolidJS signals
4. **Static Export**: DOM-less SVG export (limited use)
5. **Better Errors**: More descriptive error messages
6. **Type Hints**: Full type annotations
7. **Documentation**: More examples and tutorials

