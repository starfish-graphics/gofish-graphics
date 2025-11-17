"""Ultra-simple anywidget test for notebook."""

import anywidget
import traitlets


class SimpleWidget(anywidget.AnyWidget):
    """Minimal anywidget test."""
    
    message = traitlets.Unicode("Hello World!").tag(sync=True)
    
    _esm = """
    export default {
      async render({ model, el }) {
        console.log("SIMPLE WIDGET: render() called");
        console.log("SIMPLE WIDGET: model:", model);
        console.log("SIMPLE WIDGET: el:", el);
        console.log("SIMPLE WIDGET: message:", model.get('message'));
        
        el.innerHTML = '<div style="padding: 20px; border: 2px solid red; background: yellow;"><h1>' + model.get('message') + '</h1></div>';
        console.log("SIMPLE WIDGET: HTML set");
      }
    };
    """

