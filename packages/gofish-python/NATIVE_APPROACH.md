# Native Python Implementation Approach (Not Recommended)

## Overview

This document describes a native Python implementation approach where the AST and layout algorithms would be implemented in Python. **This approach is NOT recommended** because it would lose SolidJS reactivity, which is essential for interactive and animated graphics.

## Why Not Recommended

### JavaScript as Source of Truth

- **SolidJS Reactivity**: JavaScript/SolidJS handles all reactivity for animations and interactions
- **Interactive Graphics**: DOM manipulation and event handling requires JavaScript
- **Consistency**: Maintaining parity with JS implementation is complex
- **Performance**: JS rendering is optimized for browser DOM

### When Native Might Be Considered

Only for:
- **Static-only charts**: No interactivity or animations needed
- **Server-side rendering**: Generate static SVG without browser
- **Performance-critical**: Avoiding JS bridge overhead (rare)

## Design (If Implemented)

### AST Structure

```python
class GoFishNode:
    """Python representation of GoFishNode AST."""
    
    def __init__(self, type: str, args: dict, children: list = None):
        self.type = type
        self.args = args
        self.children = children or []
        self._intrinsic_dims = None
        self._transform = None
    
    def resolve_color_scale(self):
        """Resolve color scales (implement JS logic in Python)."""
        pass
    
    def infer_pos_domains(self):
        """Infer position domains (implement JS logic in Python)."""
        pass
    
    def infer_size_domains(self):
        """Infer size domains (implement JS logic in Python)."""
        pass
    
    def resolve_underlying_space(self):
        """Resolve underlying space (implement JS logic in Python)."""
        pass
    
    def layout(self, size, scale_factors, pos_scales):
        """Calculate layout (implement JS logic in Python)."""
        pass
    
    def place(self, position):
        """Place node (implement JS logic in Python)."""
        pass
```

### Rendering Backends

#### SVG Renderer (Static)

```python
def render_to_svg(node: GoFishNode, width: int, height: int) -> str:
    """Render node tree to static SVG string."""
    svg = f'<svg width="{width}" height="{height}">'
    # Traverse AST and generate SVG
    svg += node.render_svg()
    svg += '</svg>'
    return svg
```

#### Plotly Renderer

```python
def to_plotly_figure(node: GoFishNode, width: int, height: int):
    """Convert GoFish AST to Plotly figure."""
    import plotly.graph_objects as go
    
    fig = go.Figure()
    # Traverse AST and create Plotly traces
    for child in node.children:
        trace = convert_to_plotly_trace(child)
        fig.add_trace(trace)
    
    fig.update_layout(width=width, height=height)
    return fig
```

**Limitations:**
- Different rendering model (Plotly traces vs SVG primitives)
- No direct mapping of GoFish layout to Plotly
- Loss of GoFish-specific features
- Would need separate Plotly-specific operators

#### Bokeh Renderer

```python
def to_bokeh_plot(node: GoFishNode, width: int, height: int):
    """Convert GoFish AST to Bokeh plot."""
    from bokeh.plotting import figure
    
    p = figure(width=width, height=height)
    # Traverse AST and create Bokeh glyphs
    for child in node.children:
        glyph = convert_to_bokeh_glyph(child)
        p.add_glyph(glyph)
    
    return p
```

**Limitations:**
- Different rendering model (Bokeh glyphs vs SVG primitives)
- No direct mapping of GoFish layout to Bokeh
- Loss of GoFish-specific features
- Would need separate Bokeh-specific operators

## Implementation Requirements

### Required Work

1. **Port AST Logic**: Reimplement all GoFish AST logic in Python
   - Domain inference algorithms
   - Layout algorithms
   - Space resolution
   - Color scale resolution

2. **Port Layout Engine**: Reimplement layout engine
   - Three-pass rendering
   - Size calculations
   - Position calculations
   - Transform handling

3. **Port Coordinate Transforms**: Reimplement coordinate transforms
   - Linear, polar, clock, etc.
   - Path transformations

4. **Create Renderers**: Build renderer backends
   - SVG renderer (static)
   - Plotly converter
   - Bokeh converter

5. **Maintain Parity**: Keep in sync with JS implementation
   - New features must be ported
   - Bug fixes must be ported
   - Tests must pass in both

### Complexity

- **High**: Significant code duplication
- **Ongoing**: Continuous maintenance burden
- **Risk**: Potential divergence from JS implementation

## Recommendation

**Do NOT implement native approach** unless:

1. You have a specific use case requiring static-only rendering
2. You have resources to maintain parallel implementations
3. You're willing to lose SolidJS reactivity features

**Instead, use the JavaScript bridge approach** which:
- ✅ Maintains exact feature parity with JS
- ✅ Supports all interactive and animated features
- ✅ Requires minimal maintenance
- ✅ JavaScript remains source of truth

