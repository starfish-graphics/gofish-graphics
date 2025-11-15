# Event Handling Design

## Overview

Since JavaScript is the source of truth for GoFish, all DOM events are handled in JavaScript. Python callbacks are wrapped and passed to JavaScript event listeners.

## Architecture

### Event Flow

1. **User Interaction**: User clicks/hovers/etc. on chart element (in browser)
2. **JavaScript**: DOM event fires, JavaScript event handler receives it
3. **Bridge**: JavaScript handler calls Python callback via bridge
4. **Python**: Python callback executes with converted event data

### Key Principles

- **JavaScript handles DOM**: All event listeners are attached in JS
- **Python provides logic**: Python callbacks contain business logic
- **Bridge converts data**: Event objects are converted between JS and Python
- **Bidirectional**: Python can also trigger JS updates (e.g., animations)

## Usage

### Basic Click Handler

```python
from gofish import chart, spread, rect
from gofish.events import on_click

def handle_click(event):
    print(f"Clicked: {event['datum']}")
    print(f"Position: ({event['clientX']}, {event['clientY']})")

chart(data).flow(spread("x", dir="x")).mark(rect(h="y").on_click(handle_click)).render()
```

### Hover Handler

```python
from gofish.events import on_hover

def handle_hover(event):
    datum = event.get('datum', {})
    print(f"Hovering over: {datum}")

chart(data).mark(rect(...).on_hover(handle_hover)).render()
```

### Update Chart from Event

```python
# Python callback can trigger JS updates via signals
def handle_click(event):
    # Get the node reference
    node = event.get('target')
    if node:
        # Update via JS signal
        # This requires exposing signal API
        pass
```

## Event Object Structure

Python callbacks receive a dictionary with:

```python
{
    "type": "click",  # Event type
    "target": <element>,  # Target element
    "currentTarget": <element>,  # Current target
    "clientX": 100,  # Mouse X position
    "clientY": 200,  # Mouse Y position
    "offsetX": 50,  # Offset within element
    "offsetY": 60,  # Offset within element
    "datum": {...},  # Data associated with element (if available)
}
```

## Implementation Status

**Current Status**: Design specification. Not yet implemented.

**Required Work**:

1. **Add event methods to marks**: Marks need `.on_click()`, `.on_hover()`, etc.
2. **Add event binding in JS**: JS rendering needs to attach event listeners
3. **Bridge event conversion**: Convert JS event objects to Python dicts
4. **Signal integration**: Allow Python to trigger SolidJS signals for updates
5. **Animation control**: Python callbacks to trigger animations

## Future Enhancements

- **Event delegation**: More efficient event handling
- **Custom events**: Define custom event types
- **Event batching**: Batch multiple events
- **Streaming events**: Real-time event streams
- **State management**: Python state sync with JS signals
