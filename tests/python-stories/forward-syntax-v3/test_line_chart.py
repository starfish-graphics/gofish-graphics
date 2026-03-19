"""Equivalent of LineChart.stories.tsx — Forward Syntax V3/Line Chart."""

from gofish import Layer, chart, scatter, scaffold, select, line
from python_stories.data import CATCH_LOCATIONS_ARRAY


def story_default():
    points = (
        chart(CATCH_LOCATIONS_ARRAY)
        .flow(scatter("lake", x="x", y="y"))
        .mark(scaffold().name("points"))
    )
    lines = chart(select("points")).mark(line())
    return (
        Layer([points, lines]),
        {"w": 400, "h": 400, "axes": True},
    )
