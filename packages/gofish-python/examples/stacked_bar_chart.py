"""
Stacked bar chart example.
"""

from gofish import chart, spread, stack, rect

# Sample data
seafood = [
    {"lake": "Huron", "species": "Cisco", "count": 100},
    {"lake": "Huron", "species": "Trout", "count": 50},
    {"lake": "Superior", "species": "Cisco", "count": 80},
    {"lake": "Superior", "species": "Trout", "count": 120},
    {"lake": "Michigan", "species": "Cisco", "count": 90},
    {"lake": "Michigan", "species": "Trout", "count": 70},
]

# Create stacked bar chart
chart(seafood).flow(
    spread("lake", dir="x"),
    stack("species", dir="y")
).mark(rect(h="count", fill="species")).render(w=500, h=300, axes=True)
