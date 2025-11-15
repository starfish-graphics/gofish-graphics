"""
Event handling for GoFish Python.

Since JavaScript is the source of truth, events are handled in JS
and Python callbacks are wrapped and passed to JavaScript.
"""

from typing import Callable, Any, Optional, Dict
from .utils import to_js
from .js_bridge import get_js_bridge


class EventHandler:
    """
    Wrapper for event handlers that bridges Python callbacks to JavaScript.
    
    JavaScript handles all DOM events. Python functions are wrapped
    and passed to JavaScript event listeners.
    """
    
    def __init__(self, callback: Callable, event_type: str = "click"):
        """
        Initialize event handler.
        
        Args:
            callback: Python function to call when event fires
            event_type: Event type (click, hover, mouseenter, etc.)
        """
        self.callback = callback
        self.event_type = event_type
        self._js_handler = None
    
    def to_js(self) -> Any:
        """Convert Python callback to JavaScript handler."""
        js_bridge = get_js_bridge()
        
        # Wrap Python function in JS function
        def js_wrapper(js_event):
            """JavaScript wrapper that calls Python callback."""
            # Convert JS event to Python dict
            py_event = self._js_event_to_py(js_event)
            # Call Python callback
            try:
                result = self.callback(py_event)
                # Convert result back if needed
                return to_js(result) if result is not None else None
            except Exception as e:
                print(f"Error in Python event handler: {e}")
                return None
        
        return js_wrapper
    
    def _js_event_to_py(self, js_event: Any) -> Dict[str, Any]:
        """Convert JavaScript event object to Python dict."""
        # Extract common event properties
        event_dict = {
            "type": getattr(js_event, "type", None),
            "target": getattr(js_event, "target", None),
            "currentTarget": getattr(js_event, "currentTarget", None),
            "clientX": getattr(js_event, "clientX", None),
            "clientY": getattr(js_event, "clientY", None),
            "offsetX": getattr(js_event, "offsetX", None),
            "offsetY": getattr(js_event, "offsetY", None),
        }
        
        # Try to get datum if available
        if hasattr(js_event, "target") and js_event.target:
            target = js_event.target
            if hasattr(target, "datum"):
                event_dict["datum"] = target.datum
        
        return event_dict


def on_click(callback: Callable) -> EventHandler:
    """
    Create a click event handler.
    
    Args:
        callback: Python function(event_dict) to call on click
    
    Returns:
        EventHandler instance
    
    Example:
        >>> def handle_click(event):
        ...     print(f"Clicked: {event['datum']}")
        >>> chart(data).mark(rect(...)).on_click(handle_click)
    """
    return EventHandler(callback, "click")


def on_hover(callback: Callable) -> EventHandler:
    """
    Create a hover event handler.
    
    Args:
        callback: Python function(event_dict) to call on hover
    
    Returns:
        EventHandler instance
    
    Example:
        >>> def handle_hover(event):
        ...     print(f"Hovered: {event['datum']}")
        >>> chart(data).mark(rect(...)).on_hover(handle_hover)
    """
    return EventHandler(callback, "mouseenter")


def on_mouse_enter(callback: Callable) -> EventHandler:
    """Create a mouse enter event handler."""
    return EventHandler(callback, "mouseenter")


def on_mouse_leave(callback: Callable) -> EventHandler:
    """Create a mouse leave event handler."""
    return EventHandler(callback, "mouseleave")


# Note: Actual event binding would need to be added to marks/nodes
# This is a design specification for how events would work

