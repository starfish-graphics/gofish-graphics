"""Equivalent of Ribbon.stories.tsx — Forward Syntax V3/Ribbon."""

from gofish import Layer, chart, spread, stack, derive, rect, select, area, group
from python_stories.data import SEAFOOD


def story_basic():
    bars = (
        chart(SEAFOOD)
        .flow(
            spread("lake", dir="x", spacing=64),
            derive(lambda d: sorted(d, key=lambda r: r["count"])),
            stack("species", dir="y"),
        )
        .mark(rect(h="count", fill="species").name("bars"))
    )
    overlay = chart(select("bars")).flow(group("species")).mark(area(opacity=0.8))
    return (
        Layer([bars, overlay]),
        {"w": 400, "h": 400, "axes": True},
    )
