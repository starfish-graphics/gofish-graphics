"""Equivalent of Area.stories.tsx — Forward Syntax V3/Area."""

from gofish import Layer, chart, spread, stack, scaffold, select, area, group, log
from python_stories.data import SEAFOOD, STREAMGRAPH_DATA


def story_basic():
    return (
        Layer([
            chart(SEAFOOD)
            .flow(spread("lake", dir="x", spacing=64))
            .mark(scaffold(h="count").name("points")),
            chart(select("points")).flow(log("points")).mark(area(opacity=0.8)),
        ]),
        {"w": 500, "h": 300, "axes": True},
    )


def story_stacked():
    return (
        Layer([
            chart(SEAFOOD)
            .flow(
                spread("lake", dir="x", spacing=64),
                stack("species", dir="y"),
            )
            .mark(scaffold(h="count", fill="species").name("bars")),
            chart(select("bars")).flow(group("species")).mark(area(opacity=0.8)),
        ]),
        {"w": 400, "h": 400, "axes": True},
    )


def story_layered():
    return (
        Layer([
            chart(STREAMGRAPH_DATA)
            .flow(group("c"), spread("x", dir="x", spacing=50))
            .mark(scaffold(h="y", fill="c").name("points")),
            chart(select("points")).flow(group("c")).mark(area(opacity=0.7)),
        ]),
        {"w": 500, "h": 300, "axes": True},
    )
