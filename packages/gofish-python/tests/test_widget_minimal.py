"""Minimal widget test - no imports, just display something."""

import anywidget
import traitlets
import pandas as pd
import base64
from gofish.arrow_utils import dataframe_to_arrow

class MinimalGoFishWidget(anywidget.AnyWidget):
    """Minimal widget that just displays something."""
    
    spec = traitlets.Dict().tag(sync=True)
    arrow_data = traitlets.Unicode().tag(sync=True)
    container_id = traitlets.Unicode().tag(sync=True)
    
    _esm = """
    export default {
      async render({ model, el }) {
        console.log("MINIMAL WIDGET: render() called");
        el.style.padding = "20px";
        el.style.border = "3px solid blue";
        el.style.backgroundColor = "lightblue";
        el.style.fontSize = "20px";
        el.innerHTML = '<h2>Minimal GoFish Widget Test</h2>' +
          '<p>If you see this, the widget mechanism works!</p>' +
          '<p>Container ID: ' + model.get('container_id') + '</p>' +
          '<p>Arrow data length: ' + (model.get('arrow_data')?.length || 0) + '</p>';
        console.log("MINIMAL WIDGET: Display set");
      }
    };
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

# Test
if __name__ == "__main__":
    df = pd.DataFrame({"x": [1, 2, 3], "y": [4, 5, 6]})
    arrow_data = dataframe_to_arrow(df)
    arrow_b64 = base64.b64encode(arrow_data).decode('utf-8')
    
    widget = MinimalGoFishWidget(
        spec={"test": True},
        arrow_data=arrow_b64,
        container_id="test-container"
    )
    
    print("Minimal widget created:", widget)
    print("Use this in a notebook cell: widget")

