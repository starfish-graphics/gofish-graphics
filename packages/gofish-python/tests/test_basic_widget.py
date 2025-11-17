"""Basic anywidget test - no GoFish dependencies."""

import anywidget
import traitlets


class BasicTestWidget(anywidget.AnyWidget):
    """Ultra-simple widget to test anywidget."""
    
    text = traitlets.Unicode("AnyWidget is working!").tag(sync=True)
    
    _esm = """
    export default {
      async render({ model, el }) {
        console.log("BASIC TEST: render() called");
        console.log("BASIC TEST: model:", model);
        console.log("BASIC TEST: el:", el);
        console.log("BASIC TEST: text:", model.get('text'));
        
        el.style.padding = "20px";
        el.style.border = "3px solid green";
        el.style.backgroundColor = "yellow";
        el.style.fontSize = "24px";
        el.style.fontWeight = "bold";
        el.textContent = model.get('text');
        
        console.log("BASIC TEST: Display updated");
      }
    };
    """

