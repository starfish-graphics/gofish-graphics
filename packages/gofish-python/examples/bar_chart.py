"""
Simple bar chart example.
"""

from gofish import chart, spread, rect

# Sample data
alphabet = [
    {"letter": "A", "frequency": 28},
    {"letter": "B", "frequency": 55},
    {"letter": "C", "frequency": 43},
    {"letter": "D", "frequency": 91},
    {"letter": "E", "frequency": 81},
    {"letter": "F", "frequency": 53},
    {"letter": "G", "frequency": 19},
    {"letter": "H", "frequency": 87},
    {"letter": "I", "frequency": 52},
]

# Create chart
chart(alphabet).flow(spread("letter", dir="x")).mark(rect(h="frequency")).render(w=500, h=300, axes=True)
