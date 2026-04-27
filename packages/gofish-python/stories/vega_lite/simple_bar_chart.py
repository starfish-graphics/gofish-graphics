"""Vega-Lite/Simple Bar Chart — mirrors SimpleBarChart.stories.tsx

https://vega.github.io/vega-lite/examples/bar.html
"""

from gofish import chart, spread, rect

TITLE = "Vega-Lite/Simple Bar Chart"

_data = [
    {"a": "A", "b": 28},
    {"a": "B", "b": 55},
    {"a": "C", "b": 43},
    {"a": "D", "b": 91},
    {"a": "E", "b": 81},
    {"a": "F", "b": 53},
    {"a": "G", "b": 19},
    {"a": "H", "b": 87},
    {"a": "I", "b": 52},
]


def default(w=400, h=300):
    return (
        chart(_data)
        .flow(spread(by="a", dir="x"))
        .mark(rect(h="b"))
    )
