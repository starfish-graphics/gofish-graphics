"""Simple test to verify anywidget is working."""

import anywidget
import traitlets


class SimpleTestWidget(anywidget.AnyWidget):
    """A simple test widget to verify anywidget works."""
    
    value = traitlets.Unicode("Hello from anywidget!").tag(sync=True)
    count = traitlets.Int(0).tag(sync=True)
    
    _esm = """
    export default {
      async render({ model, el }) {
        console.log("[Test Widget] render() called");
        console.log("[Test Widget] Model:", model);
        console.log("[Test Widget] Element:", el);
        
        const updateDisplay = () => {
          const value = model.get('value');
          const count = model.get('count');
          console.log("[Test Widget] Updating display - value:", value, "count:", count);
          el.innerHTML = `
            <div style="padding: 20px; border: 2px solid #0f0; background: #000; color: #0f0; font-family: monospace;">
              <h2>AnyWidget Test</h2>
              <p>Value: <strong>${value}</strong></p>
              <p>Count: <strong>${count}</strong></p>
              <button onclick="model.set('count', model.get('count') + 1)">Increment</button>
            </div>
          `;
        };
        
        model.on('change:value', updateDisplay);
        model.on('change:count', updateDisplay);
        
        updateDisplay();
        console.log("[Test Widget] Initial display updated");
      }
    };
    """


if __name__ == "__main__":
    # Test in Jupyter
    widget = SimpleTestWidget()
    print("Widget created:", widget)
    print("Widget value:", widget.value)
    print("Widget count:", widget.count)
    print("\nDisplay the widget in Jupyter:")
    print("widget")

