"""Forward Syntax V3/Ribbon — mirrors Ribbon.stories.tsx"""

from gofish import Layer, chart, spread, stack, derive, rect, select, area, group
from stories.data.seafood import seafood

TITLE = "Forward Syntax V3/Ribbon"


def basic(w=400, h=400):
    """Ribbon chart: sorted stacked bars with an area overlay connecting species across lakes."""
    bars = (
        chart(seafood)
        .flow(
            spread("lake", dir="x", spacing=64),
            derive(lambda d: sorted(d, key=lambda r: r["count"])),
            stack("species", dir="y"),
        )
        .mark(rect(h="count", fill="species").name("bars"))
    )
    overlay = chart(select("bars")).flow(group("species")).mark(area(opacity=0.8))
    return Layer([bars, overlay])


def polar(w=400, h=400):
    """
    Polar ribbon: same as basic but rendered in clock() coordinate space.

    Blocked: needs Layer({ coord: clock() }, [...]) and clock() coordinate.
    """
    raise NotImplementedError(
        "Polar ribbon requires Layer + clock() coordinate — not yet implemented in Python wrapper"
    )
