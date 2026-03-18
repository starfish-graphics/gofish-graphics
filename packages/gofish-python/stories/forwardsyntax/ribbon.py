"""Forward Syntax V3/Ribbon — mirrors Ribbon.stories.tsx

BLOCKED: requires Layer (multi-chart composition) and clock() coordinate
transform, neither of which is implemented in the Python wrapper yet.

When Layer is added, these stories should work as written below.
"""

from gofish import chart, spread, stack, derive, rect, select, area, group
from stories.data.seafood import seafood

TITLE = "Forward Syntax V3/Ribbon"

# Blocked by: Layer not implemented in Python wrapper.
# Also blocked for Polar: clock() coordinate transform not implemented.


def basic(w=400, h=400):
    """
    Ribbon chart: sorted stacked bars with an area overlay connecting species
    across lakes.

    Blocked: needs Layer([chart1, chart2]).
    """
    raise NotImplementedError("Ribbon requires Layer — not yet implemented in Python wrapper")


def polar(w=400, h=400):
    """
    Polar ribbon: same as basic but rendered in clock() coordinate space.

    Blocked: needs Layer({ coord: clock() }, [...]) and clock() coordinate.
    """
    raise NotImplementedError(
        "Polar ribbon requires Layer + clock() coordinate — not yet implemented in Python wrapper"
    )


# What these would look like once Layer is supported:
#
# import math
#
# def basic(w=400, h=400):
#     bars = (
#         chart(seafood)
#         .flow(
#             spread("lake", dir="x", spacing=64),
#             derive(lambda d: sorted(d, key=lambda r: r["count"])),
#             stack("species", dir="y"),
#         )
#         .mark(rect(h="count", fill="species").name("bars"))
#     )
#     overlay = chart(select("bars")).flow(group("species")).mark(area(opacity=0.8))
#     return Layer([bars, overlay])
#
# def polar(w=400, h=400):
#     bars = (
#         chart(seafood)
#         .flow(
#             spread("lake", dir="x", spacing=(2 * math.pi) / 6, mode="center", y=50, label=False),
#             derive(lambda d: sorted(d, key=lambda r: r["count"])),
#             stack("species", dir="y", label=False),
#         )
#         .mark(rect(w=0.1, h="count", fill="species").name("bars"))
#     )
#     overlay = chart(select("bars")).flow(group("species")).mark(area(opacity=0.8))
#     return Layer({"coord": clock()}, [bars, overlay])
