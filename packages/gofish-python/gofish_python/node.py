"""
Python wrapper for GoFish GoFishNode.

Represents a rendered node in the chart AST. JavaScript is the source
of truth - all layout and rendering happens in JS.
"""

from typing import Optional, Dict, Any
from .js_bridge import get_js_bridge
from .utils import convert_options, to_js


class GoFishNode:
    """
    Python wrapper for GoFish GoFishNode.
    
    Represents a node in the chart AST after applying operators and marks.
    The actual node and rendering logic exists in JavaScript.
    """
    
    def __init__(self, js_node: Any, data: Any = None):
        """
        Initialize a GoFishNode wrapper.
        
        Args:
            js_node: JavaScript GoFishNode instance
            data: Original Python data (for reference)
        """
        self._js_node = js_node
        self._data = data
    
    def render(self, container_id: Optional[str] = None, container: Any = None, 
               **options) -> Any:
        """
        Render the chart to a container.
        
        Args:
            container_id: HTML element ID to render into (optional)
            container: Direct container element (optional)
            **options: Rendering options (w, h, axes, debug, etc.)
        
        Returns:
            The container element (for Jupyter, returns HTML for display)
        
        Example:
            >>> node.render("my-chart", w=500, h=300, axes=True)
        """
        from .render import render
        return render(self, container_id, container, **options)
    
    def as_layer(self, name: str) -> 'GoFishNode':
        """
        Mark this node as a named layer for use with select().
        
        Args:
            name: Layer name
        
        Returns:
            Self for chaining
        
        Example:
            >>> chart(data).mark(rect(...)).as_layer("bars")
        """
        # Call JS .as() method
        self._js_node = self._js_node.as(name)
        return self
    
    @property
    def _js_value(self) -> Any:
        """Get the underlying JavaScript node (for internal use)."""
        return self._js_node
